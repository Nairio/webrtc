import React, {useEffect, useRef} from 'react';
import {io} from './firebase'; // import {io} from 'socket.io-client';

const App = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        socket.current = io('https://localhost:3001');
        socket.current.on('offer', async (offer) => {
            await handleOffer(offer);
        });
        socket.current.on('answer', async (answer) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });
        socket.current.on('candidate', async (candidate) => {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
            localVideoRef.current.srcObject = stream;
            startCall()
        });

        return () => {
            socket.current.disconnect();
            if (peerConnection.current) peerConnection.current.close();
        };
    }, []);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.current.emit('candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        localVideoRef.current.srcObject.getTracks().forEach((track) => pc.addTrack(track, localVideoRef.current.srcObject));

        return pc;
    };

    const startCall = async () => {
        peerConnection.current = createPeerConnection();
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.current.emit('offer', offer);
    };

    const handleOffer = async (offer) => {
        peerConnection.current = createPeerConnection();

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.current.emit('answer', peerConnection.current.localDescription);
    };

    return (
        <div>
            <h1>WebRTC React STUN</h1>
            <video ref={localVideoRef} autoPlay muted width="200" playsInline={true}/>
            <video ref={remoteVideoRef} autoPlay width="200" playsInline={true}/>
        </div>
    );
};

export default App;

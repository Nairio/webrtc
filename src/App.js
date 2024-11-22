import React, {useEffect, useRef} from 'react';
//import {io} from 'socket.io-client';
import {firebaseIO} from './firebase';
import CanvasDrawing from "./CanvasDrawing";
import "./App.css";



const App = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnection = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        socket.current = firebaseIO('https://localhost:3001');
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
            const tracks = event.streams[0].getVideoTracks();

            if (remoteVideoRef.current && tracks[0]) {
                remoteVideoRef.current.srcObject = new MediaStream([tracks[0]]);
            }

            /*
                        const canvas = document.getElementById("showCanvas");
                        const context = canvas.getContext("2d");
                        const videoTrack = tracks[0];
                        const videoElement = document.createElement('video');
                        videoElement.playsInline=true;
                        videoElement.srcObject = new MediaStream([videoTrack]);
                        videoElement.onplay = () => {
                            const draw = () => {
                                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                                requestAnimationFrame(draw);
                            }
                            draw();
                        };
                        videoElement.play();
            */

        };

        localVideoRef.current.srcObject.getTracks().forEach((track) => pc.addTrack(track, localVideoRef.current.srcObject));

        /*
                const canvasStream = document.getElementById("drawCanvas").captureStream(30);
                canvasStream.getTracks().forEach((track) => pc.addTrack(track, canvasStream));
        */

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
            <div id={"console"}/>
            <h1>WebRTC React STUN</h1>
            <video ref={localVideoRef} autoPlay muted height={window.innerHeight * 0.1} playsInline={true}/>
            <video ref={remoteVideoRef} autoPlay height={window.innerHeight * 0.1} playsInline={true}/>
            <br/>
{/*            <canvas
                id={"showCanvas"}
                width={window.innerWidth/2 - 32}
                height={(window.innerWidth/2 - 32)/1.3}
                style={{border: "1px solid black"}}
            />*/}
            <CanvasDrawing/>
        </div>
    );
};

export default App;

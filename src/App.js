import React, {useEffect, useRef, useState} from 'react';
//import {io} from 'socket.io-client';
import {firebaseIO} from './firebase/signal';
import CanvasDrawing from "./draw/CanvasDrawing";
import "./App.css";
import {clearLog, Console, log} from "./components/console";
import {DeviceSelector} from "./components/deviceSelector";
import {ConnectButton} from "./components/ConnectButton";
import {UserName} from "./components/UserName";


const App = () => {
    const [status, setStatus] = useState("");
    const peerConnection = useRef(null);
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        socket.current = firebaseIO('https://localhost:3001');
        socket.current.on('offer', async (offer) => {
            if (peerConnection.current && peerConnection.current.connectionState === "connected") return;

            await handleOffer(offer);
        });
        socket.current.on('answer', async (answer) => {
            if (!peerConnection.current) return;
            if (peerConnection.current.connectionState === "connected") return;

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });
        socket.current.on('candidate', async (candidate) => {
            if (!peerConnection.current) return;
            if (peerConnection.current.connectionState === "connected") return;

            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
        socket.current.on('close', async () => {
            disconnectPC();
            clearLog();
        });

        return () => {
            socket.current.disconnect();
            if (peerConnection.current) peerConnection.current.close();
        };
    }, []);

    const createPeerConnection = () => {
        disconnectPC();
        peerConnection.current = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
        peerConnection.current.onicecandidate = (e) => e.candidate && socket.current.emit('candidate', e.candidate);
        peerConnection.current.onconnectionstatechange = (e) => {
            setStatus(e.currentTarget.connectionState);
            log([e.currentTarget.connectionState]);
        };
        peerConnection.current.ontrack = (e) => remoteVideoRef.current.srcObject = new MediaStream(e.streams[0].getTracks());

        localVideoRef.current.srcObject.getTracks().map((t) => peerConnection.current.addTrack(t, localVideoRef.current.srcObject));
    };
    const handleOffer = async (offer) => {
        createPeerConnection();

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        await peerConnection.current.setLocalDescription(await peerConnection.current.createAnswer());

        socket.current.emit('answer', peerConnection.current.localDescription);
    };
    const disconnectPC = () => {
        setStatus("closed");

        if (!peerConnection.current) return;
        peerConnection.current.close();
        peerConnection.current.onicecandidate = null;
        peerConnection.current.ontrack = null;
        peerConnection.current.ondatachannel = null;
        peerConnection.current.onconnectionstatechange = null;
        peerConnection.current = null;
    }
    const deviceChange = async (selectedVideoDevice, selectedAudioDevice) => {
        if (localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({
            video: {deviceId: {exact: selectedVideoDevice}},
            audio: {deviceId: {exact: selectedAudioDevice}}
        });

        if (peerConnection.current) {
            const senders = peerConnection.current.getSenders();
            const stream = localVideoRef.current.srcObject;

            await senders.find(s => s.track.kind === 'video').replaceTrack(stream.getVideoTracks()[0]);
            await senders.find(s => s.track.kind === 'audio').replaceTrack(stream.getAudioTracks()[0]);
        }

    }

    const startCall = async () => {
        setStatus("connecting");
        createPeerConnection();
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.current.emit('offer', offer);
    };
    const endCall = () => {
        socket.current.emit('close');
        disconnectPC();
        clearLog();
    }

    return (
        <div className={`container ${status}`}>
            <div className="top">
                <Console/>
                <video ref={localVideoRef} autoPlay muted playsInline={true}/>
                <video ref={remoteVideoRef} autoPlay playsInline={true}/>
                <DeviceSelector onSelect={deviceChange}/>
                <UserName/>
                <ConnectButton status={status} startCall={startCall} endCall={endCall}/>
            </div>
            <div className={"bottom"}>
                <CanvasDrawing/>
            </div>
        </div>
    );
};

export default App;

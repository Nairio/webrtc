import React, {useEffect, useRef, useState} from 'react';
//import {io} from 'socket.io-client';
import {firebaseIO} from './firebase/signal';
import CanvasDrawing from "./draw/CanvasDrawing";
import "./App.css";
import {storage} from "./localstorage";

const log = (text) => {
    document.getElementById("console").innerText = JSON.stringify(text)
}

const DeviceSelector = ({onSelect}) => {
    const [videoDevices, setVideoDevices] = useState(null);
    const [audioDevices, setAudioDevices] = useState(null);

    const [selectedVideoDevice, setSelectedVideoDevice] = useState(false);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState(false);


    useEffect(() => {
        (async () => {
            let selectedAudioDevice = storage("selectedAudioDevice");
            let selectedVideoDevice = storage("selectedVideoDevice");

            await navigator.mediaDevices.getUserMedia({
                video: !selectedVideoDevice || {deviceId: {exact: selectedVideoDevice}},
                audio: !selectedAudioDevice || {deviceId: {exact: selectedAudioDevice}}
            });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const video = devices.filter(device => device.kind === 'videoinput');
            const audio = devices.filter(device => device.kind === 'audioinput');

            selectedAudioDevice = selectedAudioDevice || audio[0].deviceId;
            selectedVideoDevice = selectedVideoDevice || video[0].deviceId;

            setVideoDevices(video);
            setAudioDevices(audio);
            setSelectedVideoDevice(selectedVideoDevice);
            setSelectedAudioDevice(selectedAudioDevice);

            await onSelect(selectedVideoDevice, selectedAudioDevice)
        })();
    }, []);

    if (!videoDevices) return false;
    if (!audioDevices) return false;

    return (
        <div>
            <div>
                <label>Камера:
                    <select value={selectedVideoDevice} onChange={e => {
                        setSelectedVideoDevice(e.target.value);
                        storage("selectedVideoDevice", e.target.value);
                        onSelect(e.target.value, selectedAudioDevice)
                    }}>
                        {videoDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Камера ${device.deviceId}`}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                <label>Микрофон:
                    <select value={selectedAudioDevice} onChange={e => {
                        setSelectedAudioDevice(e.target.value);
                        storage("selectedAudioDevice", e.target.value);
                        onSelect(selectedVideoDevice, e.target.value)
                    }}>
                        {audioDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Микрофон ${device.deviceId}`}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </div>
    )
}

const UserName = () => {
    const [myUserName, setMyUserName] = useState("");
    const [remoteUserName, setRemoteUserName] = useState("");

    useEffect(() => {
        const myUserName = storage("myUserName");
        if (!myUserName) {
            const myUserName = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
            storage("myUserName", myUserName);
            setMyUserName(myUserName);
        } else {
            setMyUserName(myUserName);
        }

        const remoteUserName = storage("remoteUserName");
        if (!remoteUserName) {
            const remoteUserName = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
            storage("remoteUserName", remoteUserName);
            setRemoteUserName(remoteUserName);
        } else {
            setRemoteUserName(remoteUserName);
        }
    }, [])

    return (
        <div>
            <div>
                <label>
                    My UserName
                    <input value={myUserName} onChange={e => {
                        storage("myUserName", e.target.value);
                        setMyUserName(e.target.value);
                    }}/>
                </label>

            </div>
            <div>
                <label>
                    Remote UserName
                    <input value={remoteUserName} onChange={e => {
                        storage("remoteUserName", e.target.value);
                        setRemoteUserName(e.target.value);
                    }}/>
                </label>

            </div>
        </div>

    )
}

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
        return () => {
            socket.current.disconnect();
            if (peerConnection.current) peerConnection.current.close();
        };
    }, []);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});

        pc.onicecandidate = (e) => e.candidate && socket.current.emit('candidate', e.candidate);
        pc.ontrack = (e) => remoteVideoRef.current.srcObject = new MediaStream(e.streams[0].getTracks());

        localVideoRef.current.srcObject.getTracks().map((t) => pc.addTrack(t, localVideoRef.current.srcObject));

        return pc;
    };

    const startCall = async (selectedVideoDevice, selectedAudioDevice) => {
        localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: {exact: selectedVideoDevice}
            },
            audio: {
                deviceId: {exact: selectedAudioDevice}
            }
        });

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
        <div className={"container"}>
            <div className="top">
                <div id={"console"}/>
                <video ref={localVideoRef} autoPlay muted playsInline={true}/>
                <video ref={remoteVideoRef} autoPlay playsInline={true}/>
                <DeviceSelector onSelect={startCall}/>
                <UserName/>
            </div>
            <div className={"bottom"}>
                <CanvasDrawing/>
            </div>
        </div>
    );
};

export default App;

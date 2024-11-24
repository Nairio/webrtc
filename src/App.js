import React, {useEffect, useRef, useState} from 'react';
//import {io} from 'socket.io-client';
import {firebaseIO} from './firebase/signal';
import CanvasDrawing from "./draw/CanvasDrawing";
import "./App.css";
import {storage} from "./localstorage";

const peerConnection = {current: null};


export const log = (text) => {
    const div = document.getElementById("console");
    div.innerHTML += "<br/>" + JSON.stringify(text);
    div.scrollTop = div.scrollHeight;

}

export const clearLog = () => {
    document.getElementById("console").innerHTML = ""
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

            try {
                await navigator.mediaDevices.getUserMedia({
                    video: !selectedVideoDevice || {deviceId: {exact: selectedVideoDevice}},
                    audio: !selectedAudioDevice || {deviceId: {exact: selectedAudioDevice}}
                });
            } catch (e) {
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            }


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
    const [status, setStatus] = useState("");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

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
    const startCall = async () => {
        setStatus("connecting");
        createPeerConnection();
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.current.emit('offer', offer);
    };

    const handleOffer = async (offer) => {
        createPeerConnection();

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        await peerConnection.current.setLocalDescription(await peerConnection.current.createAnswer());

        socket.current.emit('answer', peerConnection.current.localDescription);
    };

    const disconnectPC = () => {
        if (!peerConnection.current) return;
        peerConnection.current.close();
        peerConnection.current.onicecandidate = null;
        peerConnection.current.ontrack = null;
        peerConnection.current.ondatachannel = null;
        peerConnection.current.onconnectionstatechange = null;
        peerConnection.current = null;
        setStatus("closed");
    }


    return (
        <div className={`container ${status}`}>
            <div className="top">
                <div>
                    <div id={"console"}/>
                </div>
                <video ref={localVideoRef} autoPlay muted playsInline={true}/>
                <video ref={remoteVideoRef} autoPlay playsInline={true}/>
                <DeviceSelector onSelect={async (selectedVideoDevice, selectedAudioDevice) => {
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


                }}/>
                <UserName/>
                {["disconnected", "closed", "failed", ""].includes(status) ?
                    (
                        <button onClick={startCall}>Connect</button>

                    ) : (
                        <button onClick={() => {
                            socket.current.emit('close');
                            disconnectPC();
                            clearLog();
                        }}>Disconnect</button>
                    )
                }
            </div>
            <div className={"bottom"}>
                <CanvasDrawing/>
            </div>
        </div>
    );
};

export default App;

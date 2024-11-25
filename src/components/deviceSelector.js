import React, {useEffect, useState} from "react";
import {storage} from "../localstorage";

export const DeviceSelector = ({onSelect}) => {
    const [videoDevices, setVideoDevices] = useState(null);
    const [audioDevices, setAudioDevices] = useState(null);

    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
    const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");


    useEffect(() => {
        (async () => {
            const videoLabel = storage("videoLabel");
            const audioLabel = storage("audioLabel");

            await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            const devices = await navigator.mediaDevices.enumerateDevices();
            const video = devices.filter(device => device.kind === 'videoinput');
            const audio = devices.filter(device => device.kind === 'audioinput');
            const videoDevice = video.find(device => device.label === videoLabel) || video[0];
            const audioDevice = audio.find(device => device.label === audioLabel) || audio[0];
            storage("audioLabel", audioDevice.label);
            storage("videoLabel", videoDevice.label);
            setVideoDevices(video);
            setAudioDevices(audio);
            setSelectedVideoDeviceId(videoDevice.deviceId);
            setSelectedAudioDeviceId(audioDevice.deviceId);

            await onSelect(videoDevice.deviceId, audioDevice.deviceId)
        })();
    }, []);

    if (!videoDevices) return false;
    if (!audioDevices) return false;

    return (
        <div>
            <div>
                <label>Камера:
                    <select value={selectedVideoDeviceId} onChange={e => {
                        setSelectedVideoDeviceId(e.target.value);
                        storage("videoLabel", videoDevices.find(device => device.deviceId === e.target.value).label);
                        onSelect(e.target.value, selectedAudioDeviceId)
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
                    <select value={selectedAudioDeviceId} onChange={e => {
                        setSelectedAudioDeviceId(e.target.value);
                        storage("audioLabel", audioDevices.find(device => device.deviceId === e.target.value).label);
                        onSelect(selectedVideoDeviceId, e.target.value)
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

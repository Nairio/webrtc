import React, {useEffect, useState} from "react";
import {storage} from "../localstorage";

export const DeviceSelector = ({onSelect}) => {
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

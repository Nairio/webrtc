import React, {useEffect, useState} from "react";
import {storage} from "../localstorage";

export const UserName = () => {
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

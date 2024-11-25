import React from "react";

export const ConnectButton = ({status, startCall, endCall}) => {
    return (
        ["disconnected", "closed", "failed", ""].includes(status) ?
            (
                <button onClick={startCall}>Connect</button>

            ) : (
                <button onClick={endCall}>Disconnect</button>
            )

    )
}

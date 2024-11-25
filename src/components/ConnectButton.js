import React from "react";

export const ConnectButton = ({status, startCall, endCall}) => {
    return (
        <div className={"connectButton"}>
            {
                ["disconnected", "closed", "failed", ""].includes(status) ?
                    (
                        <button onClick={startCall} style={{background: "#9df19d", color: "#ffffff"}}>&#9742;</button>

                    ) : (
                        <button onClick={endCall} style={{background: "#f08888", color: "#ffffff"}}>&#9742;</button>
                    )
            }
        </div>


    )
}

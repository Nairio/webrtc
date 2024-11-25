import React from "react";

export const log = (text) => {
    const div = document.getElementById("console");
    div.innerHTML += "<br/>" + JSON.stringify(text);
    div.scrollTop = div.scrollHeight;

}
export const clearLog = () => {
    document.getElementById("console").innerHTML = ""
}

export const Console = ()=>{
    return (
        <div id={"console"}/>
    )
}

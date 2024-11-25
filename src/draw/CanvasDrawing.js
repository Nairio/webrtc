import React, {useEffect, useRef, useState} from "react";
import {firebaseDraw} from "./firebase";
import {log} from "../components/console";


const lp = {x: 0, y: 0, datas: null};

const CanvasDrawing = () => {
    const canvasRef = useRef(null);

    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const drawFromServer = (datas) => {
            lp.datas = datas;
            clearCanvas();
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;

            datas.forEach(data => {
                if (data.type !== "stroke") return;
                const [x1, y1, x2, y2] = data.data;
                drawStroke(data.isMe ? "red" : "green", x1 * w, y1 * h, x2 * w, y2 * h);
            })
        }

        firebaseDraw.on(drawFromServer);

        window.onresize = () => {
            setTimeout(()=>{
                const aspect = 1;

                const container = document.getElementsByClassName("container")[0];

                if (window.innerWidth > window.innerHeight) {
                    container.classList.add("horizontal");
                    log({w: window.innerWidth, h: window.innerHeight})
                    log("horizontal")
                } else {
                    container.classList.remove("horizontal");
                    log({w: window.innerWidth, h: window.innerHeight})
                    log("vertical")

                }

                const parentWidth = canvasRef.current.parentElement.clientWidth - 4;
                const parentHeight = canvasRef.current.parentElement.clientHeight - 4;

                const width = parentWidth * aspect > parentHeight ? parentHeight / aspect : parentWidth;
                const height = parentWidth * aspect > parentHeight ? parentHeight : parentWidth * aspect;

                canvasRef.current.width = width;
                canvasRef.current.height = height;
                lp.datas && drawFromServer(lp.datas);
            }, 300)
        };

        window.onresize()

    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawStroke = (color, x1, y1, x2, y2) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.lineWidth = 5;
        context.lineCap = "round";
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2 + 0.0001, y2 + 0.0001);
        context.stroke();
    }

    const draw = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.target.getBoundingClientRect();

        const {pageX, pageY} = (e.type.slice(0, 5) === "touch" ? e.touches[0] : e) || {
            pageX: lp.x + rect.left,
            pageY: lp.y + rect.top
        };
        const offsetX = pageX - rect.left;
        const offsetY = pageY - rect.top;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        if (isDrawing) {
            firebaseDraw.set("stroke", [lp.x / w, lp.y / h, offsetX / w, offsetY / h]);
            drawStroke("pink", lp.x, lp.y, offsetX, offsetY);
        }

        lp.x = offsetX;
        lp.y = offsetY;
    };
    const handleMouseDown = (e) => {
        draw(e);
        setIsDrawing(true);
    };
    const handleMouseMove = (e) => {
        isDrawing && draw(e);
    };
    const handleMouseUp = (e) => {
        draw(e);
        setIsDrawing(false);
    };

    return (
        <>
            <div id={"dashboard"}>
                <button onClick={firebaseDraw.clear}>Clear</button>
            </div>
            <div className={"canvasContainer"}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onMouseMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    onMouseUp={handleMouseUp}
                    onTouchCancel={handleMouseUp}
                    onMouseOut={handleMouseUp}
                />
            </div>

        </>
    );
};

export default CanvasDrawing;

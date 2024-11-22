import React, {useEffect, useRef, useState} from "react";

import {firebaseDraw} from "./firebase";

const lp = {x: 0, y: 0};

const CanvasDrawing = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        firebaseDraw.on((datas) => {
            clearCanvas();
            datas.forEach(data => {
                data.type === "stroke" && drawStroke (data.isMe ? "red" : "green", ...data.data);
            })
        });
    }, []);

    const drawStroke = (color, x1, y1, x2, y2) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.lineWidth = 5;
        context.lineCap = "round";
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    }

    const draw = (x, y) => {
        if (isDrawing) {

            firebaseDraw.set("stroke", [lp.x, lp.y, x, y]);
            drawStroke ("red", lp.x, lp.y, x, y);
        }

        lp.x = x;
        lp.y = y;
    };
    const handleMouseDown = (e) => {
        e.preventDefault();

        const {pageX, pageY} = e.type === "touchstart" ? e.touches[0] : e;
        const rect = e.target.getBoundingClientRect();
        const offsetX = pageX - rect.left;
        const offsetY = pageY - rect.top;

        setIsDrawing(true);

        lp.x = offsetX;
        lp.y = offsetY;
    };
    const handleMouseMove = (e) => {
        if (!isDrawing) return;

        e.preventDefault();

        const {pageX, pageY} = e.type === "touchmove" ? e.touches[0] : e;
        const rect = e.target.getBoundingClientRect();
        const offsetX = pageX - rect.left;
        const offsetY = pageY - rect.top;

        draw(offsetX, offsetY);
    };
    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <>
            <canvas
                id={"drawCanvas"}
                ref={canvasRef}
                width={400}
                height={400}

                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}

                onTouchMove={handleMouseMove}
                onMouseMove={handleMouseMove}

                onTouchEnd={handleMouseUp}
                onMouseUp={handleMouseUp}
                onTouchCancel={handleMouseUp}
                onMouseOut={handleMouseUp}

                style={{border: "1px solid black"}}
            />
            <br/>
            <button onClick={firebaseDraw.clear}>Очистить</button>
        </>
    );
};

export default CanvasDrawing;

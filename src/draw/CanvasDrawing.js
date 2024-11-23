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
                data.type === "stroke" && drawStroke(data.isMe ? "red" : "green", ...data.data);
            })
        });

        canvasRef.current.width = document.getElementsByClassName("bottom")[0].clientWidth;
        canvasRef.current.height = document.getElementsByClassName("bottom")[0].clientHeight ;

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


        if (isDrawing) {
            firebaseDraw.set("stroke", [lp.x, lp.y, offsetX, offsetY]);
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
            <canvas
                id={"drawCanvas"}
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
        </>
    );
};

export default CanvasDrawing;

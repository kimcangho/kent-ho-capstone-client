import "./Whiteboard.scss";
//React Hooks
import { useEffect, useState, useRef } from "react";
//Components
import FlipIndicator from "../FlipIndicator/FlipIndicator";
//Utility Functions
import { randomNumber } from "../../utilities/utilities";

const Whiteboard = ({ isDrawMode, isMobile }) => {
  //State variable
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("");
  //useRef variables
  const captureCanvasRef = useRef(null);
  const captureContextRef = useRef(null);
  const peerCanvasRef = useRef(null);
  const peerContextRef = useRef(null);
  const myCanvasRef = useRef(null);
  const myContextRef = useRef(null);

  //Set Canvas
  useEffect(() => {
    captureContextRef.current = captureCanvasRef.current.getContext("2d");
    peerContextRef.current = peerCanvasRef.current.getContext("2d");
    myContextRef.current = myCanvasRef.current.getContext("2d");

    setStrokeColor(
      `rgb(${randomNumber(255)}, ${randomNumber(255)}, ${randomNumber(255)})`
    );
  }, []);

  //Stamping Tool
  const handleStamp = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (isDrawMode) {
      console.log(offsetX, offsetY);
      myContextRef.current.strokeStyle = strokeColor;
      myContextRef.current.beginPath();
      myContextRef.current.lineWidth = 5;
      myContextRef.current.arc(offsetX, offsetY, 10, 0, 2 * Math.PI);
      myContextRef.current.stroke();
      myContextRef.current.closePath();
    }
  };

  //Drawing Tool
  //Start Drawing - Mouse
  const startDrawing = ({ nativeEvent }) => {
    if (!isDrawMode) {
      const { offsetX, offsetY } = nativeEvent;
      console.log(offsetX, offsetY);
      myContextRef.current.beginPath();
      myContextRef.current.moveTo(offsetX, offsetY);
      myContextRef.current.strokeStyle = strokeColor;
      setIsDrawing(true);
    }
  };
  //While Drawing - Mouse
  const drawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    myContextRef.current.lineWidth = 5;
    const { offsetX, offsetY } = nativeEvent;
    myContextRef.current.lineTo(offsetX, offsetY);
    myContextRef.current.stroke();
  };
  //Finish Drawing - Mouse
  const finishDrawing = () => {
    if (!isDrawing) return;
    myContextRef.current.closePath();
    setIsDrawing(false);
  };

  return (
    <article className="whiteboard">
      <canvas ref={captureCanvasRef} className="whiteboard__layer"></canvas>
      <canvas
        ref={peerCanvasRef}
        className="whiteboard__layer whiteboard__layer--peer"
      ></canvas>
      <canvas
        ref={myCanvasRef}
        className="whiteboard__layer whiteboard__layer--me"
        onPointerDown={startDrawing}
        onPointerUp={finishDrawing}
        onPointerMove={drawing}
        onPointerCancel={finishDrawing}
        onClick={handleStamp}
      ></canvas>

      <FlipIndicator isDrawMode={isDrawMode} />
    </article>
  );
};

export default Whiteboard;

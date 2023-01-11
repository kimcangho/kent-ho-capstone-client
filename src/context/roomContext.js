import { createContext, useEffect, useState, useReducer } from "react";
import { useNavigate } from "react-router";
import socketIOClient from "socket.io-client";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "./peerReducer";
import { addPeerAction, removePeerAction } from "./peerActions";

//Server URL
const WS = "http://localhost:8000/";
// const WS="https://squiggled-server.herokuapp.com/";

//Web Signaling server
const ws = socketIOClient(WS);

//Room Context
const RoomContext = createContext();

const RoomProvider = ({ children }) => {
  //Navigation
  const navigate = useNavigate();
  //State
  const [me, setMe] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  // const [peerUsername, setPeerUsername] = useState("");
  const [stream, setStream] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [peers, dispatch] = useReducer(peersReducer, {}); //useReducer

  //Enter Room
  const enterRoom = ({ roomId }) => {
    setInRoom(true);
    setRoomId(roomId);
    console.log("ROom Id is " + roomId);
    navigate(`/session/${roomId}`);
  };
  //Get Users
  const getUsers = ({ participants }) => {
    console.log({ participants });
  };

  //Redirect if room is full
  const redirectHome = ({ roomId }) => {
    console.log(`${roomId} is full`);
    setInRoom(false);
    setRoomId(null);
    navigate("/error");
  };

  const removePeer = ({ peerId }) => {
    dispatch(removePeerAction(peerId));
    setInRoom(false);
    setRoomId(null);
    navigate("/setup");
  };

  //Empty Room
  const emptyRoom = () => {
    setInRoom(false);
    setRoomId(null);
    console.log("ALl users out!");
    navigate("/setup");
  };

  useEffect(() => {
    //Create peer object for user
    const myId = uuidV4();
    const peer = new Peer(myId);
    console.log(peer.id);
    setMe(peer);


    //Get devices
    navigator.mediaDevices.enumerateDevices().then(devices => {
      console.log(devices);
      const videoDevices = devices.filter(device => {
        return device.kind === 'videoinput'
      })
      videoDevices.forEach(device => console.log(device.deviceId));
    })

    //Websocket Listeners
    ws.on("room-created", enterRoom);
    ws.on("get-users", getUsers);
    ws.on("room-full", redirectHome);
    ws.on("user-disconnected", removePeer);
    ws.on("empty-room", emptyRoom);
  }, []);

  useEffect(() => {
    //Check if user peer object and stream are available
    if (!me || !stream) return;

    //User joined room listener where you initiate call
    ws.on("user-joined", ({ peerId, roomId }) => {
      console.log(roomId);
      //Create call for every new joined user
      const call = me.call(peerId, stream); //Call user with peerId and pass our stream
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(peerId, peerStream));
      });
    });

    //Call event listener for every user that calls us
    //We answer call of another peer
    me.on("call", (call) => {
      call.answer(stream); //Answer call with our own stream
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(call.peer, peerStream));
      });
    });
  }, [me, stream]);

  return (
    <RoomContext.Provider
      value={{
        ws,
        me,
        myUsername,
        setMyUsername,
        stream,
        setStream,
        peers,
        inRoom,
        setInRoom,
        roomId,
        setRoomId,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export { RoomProvider, RoomContext };

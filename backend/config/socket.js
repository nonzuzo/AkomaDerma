// config/socket.js
let _io = null;

export const setIO = (ioInstance) => {
  _io = ioInstance;
};

export const getIO = () => _io;

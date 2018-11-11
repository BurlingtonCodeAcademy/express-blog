const Room = require('./room.js');
const Message = require('./message.js');

module.exports = class House {
  constructor() {
    this.rooms = {};
  }

  roomWithId(roomId) {
    let room = this.rooms[roomId];
    if (!room) {
      room = new Room(roomId);
      this.rooms[roomId] = room;
    }
    return room;
  }

  sendMessageToRoom(roomId, messageOptions) {
    this.roomWithId(roomId).sendMessage(new Message(messageOptions));
  }
};

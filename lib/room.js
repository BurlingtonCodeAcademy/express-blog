function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = class Room {
  constructor(id, name) {
    if (!id) {
      throw 'room id required';
    }
    if (!(id.match(/^[a-z]+$/))) {
      throw 'room id must contain only lowercase letters'
    }
    this.id = id;
    this.name = name || capitalize(id);
    this.messages = [];
  }

  messageCount() {
    return this.messages.length;
  }

  sendMessage(message) {
    this.messages.push(message);
  }

  messagesSince(moment) {
    return this.messages.filter(
      (message) => {
        return message.when > moment
      }
    );
  }
};

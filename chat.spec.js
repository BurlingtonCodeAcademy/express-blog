'use strict';
const Message = require('./lib/message.js');

// run with:
// npx jasmine-node --verbose chat.spec.js

// Jasmine cheatsheet: https://jasmine.github.io/2.0/introduction

describe('Message', () => {

  let message;

  describe('when constructed with no parameters', () => {
    beforeEach(() => {
      message = new Message();
    });

    it('is constructed via a JavaScript class', () => {
      expect(message instanceof Message).toBe(true);
    });

    it('contains the current time', () => {

      // `new Date()` returns the current moment (date-and-time)
      // which should be within 1 ms of the moment when the message
      // was created

      // to watch it fail, uncomment the next line for a 2ms delay
      // for(let i=0; i<1000000; ++i);

      expect(message.when).toBeCloseTo(new Date(), 2);
    });

    it('was written by "Anonymous"', () => {
      expect(message.author).toEqual('anonymous');
    });

    it('has an empty message body', () => {
      expect(message.body).toEqual('');
    });
  });

  describe('when constructed with an author', () => {
    beforeEach(() => {
      message = new Message({author: 'alice'});
    });

    it('was written by that author', () => {
      expect(message.author).toEqual('alice');
    });

    it('contains the current time', () => {
      expect(message.when).toBeCloseTo(new Date(), 1);
    });

    it('has an empty message body', () => {
      expect(message.body).toEqual('');
    });

  });

  describe('when constructed with a body', () => {
    beforeEach(() => {
      message = new Message({body: 'My dog has fleas.'});
    });

    it('contains that body', () => {
      expect(message.body).toEqual('My dog has fleas.');
    });

    it('contains the current time', () => {
      expect(message.when).toBeCloseTo(new Date(), 1);
    });

    it('was written by "Anonymous"', () => {
      expect(message.author).toEqual('anonymous');
    });
  });

  describe('when constructed with an author and a body', () => {
    beforeEach(() => {
      message = new Message({author: 'alice', body: 'My dog has fleas.'});
    });

    it('was written by that author', () => {
      expect(message.author).toEqual('alice');
    });

    it('contains that body', () => {
      expect(message.body).toEqual('My dog has fleas.');
    });

    it('contains the current time', () => {
      expect(message.when).toBeCloseTo(new Date(), 1);
    });
  });

  describe('when serialized into JSON', () => {
    let json;

    beforeEach(() => {
      message = new Message({author: 'alice', body: 'My dog has fleas.'});
      // normally messages set their own "when"
      // but for testing purposes only, we are forcing it to be a known date
      message.when = new Date(Date.UTC(2017, 10, 1, 11, 3, 4));

      json = JSON.stringify(message);
    });
    it('contains an author field', () => {
      expect(json).toContain('"author":"alice"');
    });
    it('contains an author field', () => {
      expect(json).toContain('"body":"My dog has fleas."');
    });
    it('contains a when field', () => {
      expect(json).toContain('"when":"2017-11-01T11:03:04.000Z"');
    });

  })
});

const Room = require('./lib/room.js');
describe('Room', () => {
  let room;

  it('when constructed, requires a room id', () => {
    expect(() => {
      new Room()
    }).toThrow('room id required');

    expect(() => {
      new Room('')
    }).toThrow('room id required');
  })

  it('when constructed, requires a room id with no spaces or symbols or capital letters', () => {
    expect(() => {
      new Room('my room')
    }).toThrow('room id must contain only lowercase letters');

    expect(() => {
      new Room('my-room')
    }).toThrow('room id must contain only lowercase letters');

    expect(() => {
      new Room('ChatRoom')
    }).toThrow('room id must contain only lowercase letters');
  })

  it('can be constructed with a valid room id', () => {
    room = new Room('debugging');
    expect(room.id).toEqual('debugging');
  });

  it('when constructed with a valid room id, makes a capitalized name based on that id', () => {
    room = new Room('debugging');
    expect(room.name).toEqual('Debugging');
  });

  it('when constructed with a room id and a name, uses both id and name', () => {
    room = new Room('debugging', 'Debugging Help');
    expect(room.name).toEqual('Debugging Help');
    expect(room.id).toEqual('debugging');
  });

  describe('messaging', () => {

    beforeEach(() => {
      room = new Room('general');
    });

    describe('at first', () => {
      it('has no messages', () => {
        expect(room.messageCount()).toEqual(0);
      });
    });

    describe('after being sent a single message', () => {
      let message;

      beforeEach(() => {
        message = new Message({body: 'hello'});
        room.sendMessage(message);
      });

      it('has an updated message count', () => {
        expect(room.messageCount()).toEqual(1);
      });

      it('contains that message in its list of messages', () => {
        let messages = room.messages;
        expect(messages[0]).toEqual(message);
      });
    });

    describe('after being sent several messages', () => {
      let earlyMessage, lateMessage, laterMessage;
      let nine_am = new Date(2017, 10, 1, 9, 0, 0);
      let noon = new Date(2017, 10, 1, 12, 0, 0);
      let six_pm = new Date(2017, 10, 1, 18, 0, 0);
      let nine_pm = new Date(2017, 10, 1, 21, 0, 0);

      beforeEach(() => {
        // normally messages set their own "when"
        // but for testing purposes only, we are forcing it to be a known date-time

        earlyMessage = new Message({body: 'good morning'});
        earlyMessage.when = nine_am;
        room.sendMessage(earlyMessage);

        lateMessage = new Message({body: 'good evening'});
        lateMessage.when = six_pm;
        room.sendMessage(lateMessage);

        laterMessage = new Message({body: 'good night'});
        laterMessage.when = nine_pm;
        room.sendMessage(laterMessage);

      });

      it('has an updated message count', () => {
        expect(room.messageCount()).toEqual(3);
      });

      it('contains all messages in its list of messages', () => {
        expect(room.messages[0]).toEqual(earlyMessage);
        expect(room.messages[1]).toEqual(lateMessage);
        expect(room.messages[2]).toEqual(laterMessage);
      });

      it('can return only messages since a certain moment', () => {
        let messages = room.messagesSince(noon);
        expect(messages).not.toContain(earlyMessage);
        expect(messages).toContain(lateMessage);
        expect(messages).toContain(laterMessage);
      });
    });
  });
});

const House = require('./lib/house.js');
describe('House', () => {

  let house;

  beforeEach(() => {
    house = new House();
  });

  it('creates a room when asked for it', () => {
    let room = house.roomWithId('general');
    expect(room instanceof Room).toBe(true);
    expect(room.id).toEqual('general');
  });

  it('can maintain several rooms', ()=>{
    let room = house.roomWithId('general');
    let otherRoom = house.roomWithId('dogs');
    let firstRoomAgain = house.roomWithId('general');

    expect(room.id).toEqual('general');
    expect(otherRoom.id).toEqual('dogs');
    expect(firstRoomAgain.id).toEqual('general');
  });

  it('can list all room ids', () => {
    let generalRoom = house.roomWithId('general');
    let dogsRoom = house.roomWithId('dogs');

    expect(house.allRoomIds()).toContain('dogs')
    expect(house.allRoomIds()).toContain('general')
    
    expect(house.allRoomIds().length).toEqual(2);
  });

  it('reuses an existing room when asked for it twice', ()=>{
    let hello = new Message({body: 'hello'});

    let room = house.roomWithId('general');
    room.sendMessage(hello);

    let roomAgain = house.roomWithId('general');
    expect(roomAgain.messages).toContain(hello);
  });

  it('can send a message to a room directly too', ()=>{

    house.sendMessageToRoom('general', {body: 'hello'});

    let room = house.roomWithId('general');
    expect(room.messages.length).toEqual(1);
    expect(room.messages[0].body).toEqual('hello');
  });

});

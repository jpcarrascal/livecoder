midiMessageType = function(firstByte) {
    const messageType = firstByte & 0xF0;
    switch (messageType) {
      case 0x80:
        return 'NOTE_OFF';
      case 0x90:
        return 'NOTE_ON';
      case 0xB0:
        return 'CC_CHANGE';
      case 0xC0:
        return 'P_CHANGE';
      case 0xE0:
        return 'PITCH_BEND';
      default:
        return 'OTHER';
    }
  }


/* ------------ MIDI Class ------------ */

class MIDI {
  constructor(
    {
      stateChangeHandler = null,
      midiIn = null,
      midiOut = null
    } = {}
  ) {
      this.inputs = [];
      this.outputs = [];
      this.midiInHandler = null;
      this.stateChangeHandler = stateChangeHandler;
      this.initializeMIDI(this.midiInHandler);
  }

  initializeMIDI() {
      navigator.requestMIDIAccess()
          .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
  }

  onMIDISuccess(midiAccess) {
      for (let input of midiAccess.inputs.values()) {
          this.inputs.push(input);
          //input.onmidimessage = this.midiInHandler.bind(this);
          input.selected = false;
      }

      for (let output of midiAccess.outputs.values()) {
        this.outputs.push(output);
      }

      midiAccess.onstatechange = function(e) {
          console.log(e.port.name, e.port.manufacturer, e.port.state);
      };
  }

  onMIDIFailure() {
      throw new Error('Could not access your MIDI devices.');
  }
  
  listInputs() {
    return this.inputs;
  }

  listOutputs() {
    return(this.outputs);
  }

  setInputHandler(index, handler) {
    while(true) {
      try {
        this.inputs[index].onmidimessage = handler;
        return this.inputs[index];
      } catch (e) {
        //return 'Invalid input index';
        if(this.inputs.length <= 0) {
          throw new Error('No MIDI inputs detected (yet?). Try again in a couple of seconds.');
        }
        throw new Error('Invalid input port index. Use listInputs() to get a list of available inputs.');
      }
    }
  }
}

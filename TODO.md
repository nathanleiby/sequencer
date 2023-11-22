

- [ ] geting user input and measuring its correctness
  - [x] capture input time of keyboard press
  - [x] show shape to indicate when press occurred
  - [x] allow N keyboard inputs, one capturing presses for each row
  - [ ] do equivalent for midi input
- [ ] Runtime training tools
  - [ ] allow speeding up or slowing down the sample
  - [ ] play a metronome
  - [ ] allow choosing a loop to practice
- [ ] Building loops
  - allow a user to input any loop and save it for training
- [ ] Across session training tools
  - [ ] save training history
    - [ ] how fast, how accurate
- [ ] support for Drumkit sounds
  - p0
    - [ ] kick
    - [ ] snare
    - [ ] hi hat
  - p1
    - [ ] crash
    - [ ] ride
    - [ ] open hihat
  - p 2
    - [ ] tom 1,2,3
    - [ ] ride (bell)


----

- [ ] https://tonejs.github.io/examples/stepSequencer

Scheduling

- when clicked.. schedule a note against the overall transport time, with looping enableed
  - play once vs play every time.. want play every time if using transport loop
  - https://tonejs.github.io/docs/14.7.77/Player.html#sync

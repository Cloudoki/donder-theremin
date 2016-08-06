int val = 0;
const int piezoPin =  6;

void setup() {
  Serial.begin(9600);
  pinMode(piezoPin, OUTPUT);
  delay(3000);
}

void loop() {
  // val = 4 * analogRead(A5);
  // Serial.print(val);
  // Serial.print("\n");
  digitalWrite(piezoPin, HIGH);
  delayMicroseconds(val);
  val = 4 * analogRead(A5);
  digitalWrite(piezoPin, LOW);
  delayMicroseconds(val);

}

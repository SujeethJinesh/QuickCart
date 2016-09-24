#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>   // The following files are included in the libraries Installed
#include <NfcAdapter.h>

PN532_I2C pn532_i2c(Wire);
NfcAdapter nfc = NfcAdapter(pn532_i2c);  // Indicates the Shield you are using

boolean last = false;

void setup(void) {
  Serial.begin(115200);
  nfc.begin();
}

void loop(void) {
  if (nfc.tagPresent()) {
    if (last == false) {
      NfcTag tag = nfc.read();
      send(tag.getUidString()); // Retrieves the Unique Identification from your tag
      last = true;
    }
  } else {
    last = false;
  }
}

void send(String uid) {
  Serial.print("POST /scan-tag HTTP/1.1");
  Serial.print("\r");
  Serial.print("\n");
  Serial.print("Host: quickcart.me");
  Serial.print("\r");
  Serial.print("\n");
  Serial.print("User-Agent: Arduino ESP8266");
  Serial.print("\r");
  Serial.print("\n");
  Serial.print("Content-Type: application/x-www-form-urlencoded");
  Serial.print("\r");
  Serial.print("\n");
  Serial.print("Content-Length: 18");
  Serial.print("\r");
  Serial.print("\n");
  Serial.print("\r");
  Serial.print("\n");
  String uidStr = "uid=" + uid;
  uidStr.replace(" ", "");
  Serial.print(uidStr);
  Serial.print("\r");
  Serial.print("\n");
}

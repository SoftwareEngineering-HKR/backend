import json
import uuid
import paho.mqtt.client as mqtt

# ---- Configuration ----
BROKER = "localhost"
PORT = 1883

DEVICE_ID = f"deviceTest1"

REGISTER_TOPIC = "register"
TEST_TOPIC = "temperature/" + DEVICE_ID

# Track register publish MID
register_mid = None


# ---- Callbacks ----

def on_connect(client, userdata, flags, rc):
    global register_mid

    if rc == 0:
        print("Connected (CONNACK received)")

        payload = {
            "id": DEVICE_ID,
            "type": "light",
            "maxVal": 1024,
            "minVal": 0,
            "sensor": False
        }

        # Publish register message QoS 1
        info = client.publish(
            REGISTER_TOPIC,
            json.dumps(payload),
            qos=1
        )

        register_mid = info.mid

        print(f"Register publish sent. MID={register_mid}")

    else:
        print(f"Connection failed with code {rc}")


def on_publish(client, userdata, mid):
    global register_mid

    print(f"PUBACK received for MID={mid}")

    # Only react to REGISTER message PUBACK
    if mid == register_mid:
        print("Register PUBACK confirmed → sending TEST publish")

        client.publish(
            TEST_TOPIC,
            21,
            qos=1
        )


def on_message(client, userdata, msg):
    print(f"Received message {msg.topic}: {msg.payload.decode()}")


# ---- Client Setup ----

client = mqtt.Client(client_id=DEVICE_ID)

client.on_connect = on_connect
client.on_publish = on_publish
client.on_message = on_message

client.connect(BROKER, PORT, 60)

client.loop_forever()
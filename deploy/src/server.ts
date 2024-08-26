console.log("Hello via Bun!");
import { subscribe_to_sqs_message } from "./utils";

while (true) {
  await subscribe_to_sqs_message();
}
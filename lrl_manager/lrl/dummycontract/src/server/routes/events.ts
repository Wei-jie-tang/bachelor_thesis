import express from "express";
import { emit } from "../../client/events";
import { contract } from "./methods";
import requestIp from "request-ip";
let subID = 0;

export const eventRouter = express.Router();
eventRouter.use(express.json());
eventRouter.use(requestIp.mw());

eventRouter.get("/events/pastEvents/:event", (req, res) => {
  const event = req.params.event;
  console.log(`Received past events request: ${event}`);
  contract
    .getPastEvents(event)
    .then((events) => {
      console.log(
        `Sending: ${events.length} ${events.length === 1 ? "event" : "events"}`
      );
      res.send({ events });
    })
    .catch((err) => {
      console.error(err);
    });
});

eventRouter.get("/events/pastEvents/:event/*", (req, res) => {
  const filterParams = req.params[0].split("/");
  const event = req.params.event;
  console.log(
    `Received past events request: ${event}\nFilter: ${filterParams.slice(1)}`
  );
  if (filterParams.length < 1) {
    contract
      .getPastEvents(event, {})
      .then((events) => {
        console.log(
          `Sending: ${events.length} ${events.length === 1 ? "event" : "events"}`
        );
        res.send({ events });
      })
      .catch((err) => {
        console.error(err);
      });
  } else if (filterParams.shift() === "filter") {
    const filter = {};
    while (filterParams.length > 0) {
      filter[filterParams.shift()] = filterParams.shift();
    }
    console.log(`FILTER: ${JSON.stringify(filter)}`);
    contract
      .getPastEvents(event, { filter })
      .then((events) => {
        console.log(
          `Sending: ${events.length} ${events.length === 1 ? "event" : "events"}`
        );
        res.send({ events });
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

eventRouter.post("/events/once", (req, res) => {
  const currentID = ++subID;
  const params = req.body;
  const sender = req.clientIp.split(":")[3];

  contract.once(params.event, params.filter, (error, event) => {
    emit(sender, currentID, event);
  });
  res.send(currentID.toString());
});

eventRouter.post("/events/NewNode", (req, res) => {
  const sender = req.clientIp.split(":")[3];
  console.log("Received event subscription: NewNode");
  const currentID = ++subID;
  const params = req.body;
  contract.events.NewNode(
    {
      filter: params.filter,
    },
    (error, event) => {
      console.log(`Emitting ${event.event}`);
      emit(sender, currentID, event);
    }
  );
  res.status(200);
  res.send(currentID.toString());
});

eventRouter.post("/events/NewAsset", (req, res) => {
  const currentID = ++subID;
  const params = req.body;
  const sender = req.clientIp.split(":")[3];

  contract.events.NewAsset(
    {
      filter: params.filter,
    },
    (error, event) => {
      emit(sender, currentID, event);
    }
  );
  res.send(currentID.toString());
});

eventRouter.post("/events/InheritorChosen", (req, res) => {
  const currentID = ++subID;
  const params = req.body;
  const sender = req.clientIp.split(":")[3];

  contract.events.InheritorChosen(
    {
      filter: params.filter,
    },
    (error, event) => {
      emit(sender, currentID, event);
    }
  );
  res.send(currentID.toString());
});

eventRouter.post("/events/ExecutorChosen", (req, res) => {
  const currentID = ++subID;
  const params = req.body;
  const sender = req.clientIp.split(":")[3];

  contract.events.ExecutorChosen(
    {
      filter: params.filter,
    },
    (error, event) => {
      emit(sender, currentID, event);
    }
  );
  res.send(currentID.toString());
});

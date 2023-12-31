const messageEvent = {
  messageType: null,
  from: { uid: null, username: null, socketClient: null },
  data: null,
};

export const getMessageEvent = (messageType, fromDetails, data) => {
  return {
    messageType,
    from: fromDetails,
    data,
  };
  /*messageEvent.messageType = messageType;
    messageEvent.from = fromDetails;
    messageEvent.data = data;*/
};

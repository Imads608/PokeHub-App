import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from '../../../store/store';
import { getCurrentChatRoom } from '../../../store/selectors/room';
import { PublicRoomData } from "../../../store/reducers/room";
import ChatRoomTabsHeader from "./windows/chatroomTabsHeader";
import SelectChatRoomWindow from "./windows/selectChatRoomWindow";

const ChatRoomMainWindow = () => {
    const currentChatRoom = useSelector<RootState, PublicRoomData>(getCurrentChatRoom);

    console.log('ChatRoomMainWindow: ', currentChatRoom);
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ChatRoomTabsHeader chatroomId={currentChatRoom ? currentChatRoom.id : '1'} selectedTab={currentChatRoom ? currentChatRoom.state.currentTab : undefined } />
            <SelectChatRoomWindow />
        </div>
    )

}

export default ChatRoomMainWindow;
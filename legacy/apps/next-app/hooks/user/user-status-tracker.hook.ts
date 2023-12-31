import { IUserData, IUserStatusData, Status } from "@pokehub/user/interfaces";
import { status_update } from "../../store/user/user.reducer";
import { getIsRefreshNeeded, getUser, getUsersNSClientId, getUserStatus } from "../../store/user/user.selector";
import { RootState } from "../../store/store";
import { IdleTimerAPI, useIdleTimer } from "react-idle-timer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";

export const useUserTrackerStatus = (): IdleTimerAPI => {
    const user = useSelector<RootState, IUserData>(getUser);
    const socketId = useSelector<RootState, string>(getUsersNSClientId);
    const userStatus = useSelector<RootState, IUserStatusData>(getUserStatus);
    const isSocketRefreshNeeded = useSelector<RootState, boolean>(getIsRefreshNeeded);

    const dispatch = useDispatch();

    let lastSeen: Date = new Date();

    useEffect(() => {
        isSocketRefreshNeeded && toast.error('Could not connect to the Server. Please Refresh your page.',
        {
          position: toast.POSITION.TOP_CENTER,
          autoClose: false
        });
    }, [isSocketRefreshNeeded]);

    const onActive = (e: Event) => {
        console.log('onActive: Hit');
        if (userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
          console.log('onActive: Sending update');
          lastSeen = new Date();
          dispatch(status_update({ lastSeen: new Date(), state: Status.ONLINE, uid: user.uid, id: userStatus.id, username: user.username, socketId, isHardUpdate: false }));
        }
      }
    
      const onIdle = (e: Event) => {
        console.log('onIdle: Hit');
        if (userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
          console.log('onIdle: Sending update');
          lastSeen = new Date();
          dispatch(status_update({ lastSeen: new Date(), state: Status.AWAY, id: userStatus.id, uid: user.uid, username: user.username, socketId, isHardUpdate: false }));
        }
      }
    
      const onAction = (e: Event) => {
        const diffMilliseconds = (new Date()).valueOf() - lastSeen.valueOf();
        
        if (diffMilliseconds >= 1000*60*5 && userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
          console.log('onAction: Sending update');
          lastSeen = new Date();
          dispatch(status_update({ lastSeen: new Date(), state: Status.ONLINE, id: userStatus.id, uid: user.uid, username: user.username, socketId, isHardUpdate: false }));
        }
      }
    
      return useIdleTimer({ onActive, onIdle, onAction, timeout: 1000 * 60 * 5,
        events: [
          'mousemove',
          'keydown',
          'wheel',
          'DOMMouseScroll',
          'mousewheel',
          'mousedown',
          'touchstart',
          'touchmove',
          'MSPointerDown',
          'MSPointerMove',
          'visibilitychange'
        ],
        debounce: 0,
        throttle: 0,
        eventsThrottle: 200,
        startOnMount: false,
        startManually: true,
        stopOnIdle: false,
        crossTab: false
      });
    
}
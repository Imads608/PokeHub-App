import React from 'react';
import TextField from '@material-ui/core/TextField';
import GroupIcon from '@material-ui/icons/Group';
import { withStyles, fade } from "@material-ui/core/styles";
import FormControl from '@material-ui/core/FormControl';
import Divider from '@material-ui/core/Divider';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import Member from './Member';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setChatRoomState } from '../../../actions/chat';
import InfiniteScroll from 'react-infinite-scroll-component';
import CircularProgress from '@material-ui/core/CircularProgress';
import { UserPropTypes } from '../../../types/user';
import { ChatroomPropTypes } from '../../../types/chatroom';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import '../chat.css';

const styles = (theme) => ({
    root: {
        padding: "2px 4px",
        display: "flex",
        alignItems: "center",
        width: 300,
        height: 40
      },
      input: {
        marginLeft: theme.spacing(1),
        flex: 1
      },
      iconButton: {
        padding: 10
      },
      divider: {
        height: 24,
        margin: 4
      }
  });

class Members extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        searchText: '',
         typingTimeout: 0
      }
      this.inputRef = React.createRef();
      this.onSearchFieldChange = this.onSearchFieldChange.bind(this);
    }
  
    componentDidMount() {
      this.inputRef.current.focus();
      this.props.setChatRoomState({ url: { pathname: this.props.location.pathname, search: this.props.location.search } }, this.props.roomId);
    }

    componentWillUnmount() {
      this.props.resetFilter();
    }

    componentDidUpdate(prevProps, prevState) {
      this.inputRef.current.focus();
    }

    onSearchFieldChange(e) {
      if (this.state.typingTimeout) {
        clearTimeout(this.state.typingTimeout);
      }
      this.setState({ searchText: e.target.value, typingTimeout: setTimeout(() => {
        this.props.searchOnNewFilter(this.state.searchText);
      }, 500)});
    }

    render() {
        const { classes, user, fetched: { results, search, offset, isDone, localLoading }, getResults } = this.props;
        console.log('Members', this.props.fetched);
        return (
            <div className='main-window window-layout'>
                <section className='search-section'>
                    <GroupIcon color='secondary' fontSize='large'/>
                    <Paper style={{ marginLeft: '10px' }} component="form" className={classes.root} >
                        <InputBase
                            className={classes.input} 
                            placeholder="Search Members"
                            inputRef={this.inputRef}
                            value={this.state.searchText}
                            disabled={localLoading}
                            onChange={this.onSearchFieldChange}
                            inputProps={{ "aria-label": "search members" }}
                        />
                        <IconButton disabled className={classes.iconButton} aria-label="search">
                            <SearchIcon />
                        </IconButton>
                    </Paper>
                </section>
                <Divider variant='middle' />
                { localLoading ? <CircularProgress style={{ margin: 'auto' }} color='secondary' /> : 
                results.length === 0 && search ? (
                  <section className='empty-search-results'>
                    <div style={{ fontSize: '20px' }} className='drawer-header'>Nothing Found</div>
                    <SentimentVeryDissatisfiedIcon fontSize='large' style={{ width: '80px', height: '80px', color: 'grey' }} />
                  </section>
                ) :
                (
                  <section id='scrollMembers' className='search-results'>
                    <InfiniteScroll
                      dataLength={results.length}
                      next={() => getResults(search, offset)}
                      hasMore={!isDone}
                      loader={<h4>Loading...</h4>}
                      scrollableTarget='scrollMembers'
                    >
                      {this.props.fetched && results.map((member) => (
                        <Member key={member.uid} username={member.username} disable={user.username === member.username} />
                      ))}
                    </InfiniteScroll>
                  </section>
                )}
            </div>
        )
    }
}

Members.propTypes = {
  classes: PropTypes.object.isRequired,
  user: UserPropTypes.isRequired,
  location: PropTypes.object.isRequired,
  fetched: PropTypes.object.isRequired,
  roomId: PropTypes.number.isRequired,
  searchOnNewFilter: PropTypes.func.isRequired,
  setChatRoomState: PropTypes.func.isRequired,
  getResults: PropTypes.func.isRequired,
  resetFilter: PropTypes.func.isRequired
}

export default connect(null, { setChatRoomState })(withStyles(styles)(Members));
import React from 'react';

const withDrawerState = (WrappedComponent) => {
  return class extends React.Component {
    state = {
      toggleValue: false,
    };

    render() {
      return (
        <WrappedComponent toggle={this.state.toggleValue} {...this.props} />
      );
    }
  };
};

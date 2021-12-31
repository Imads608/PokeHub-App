import { Typography } from "@mui/material";

const Copyright = () => {
    return (
      <Typography variant="body2" color="textSecondary" align="center">
        {'Copyright © PokeHub '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
}

export default Copyright;
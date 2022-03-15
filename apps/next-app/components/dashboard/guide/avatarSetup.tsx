import { Avatar, Button, CustomTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ChangeEvent, useEffect, useState } from "react";

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
      paddingTop: '5px',
      marginLeft: '5px'
    },
    form: {
        display: 'flex',
        alignItems: 'center'
    },
    messageSuccess: {
        marginLeft: '5px',
        color: theme.palette.success.main
    },
    messageError: {
        marginLeft: '5px',
        color: theme.palette.error.main
    }
}));

interface AvatarSetupProps {
    avatarChosen: ( avatar: FormData ) => void
};

const AvatarSetup = ({ avatarChosen }: AvatarSetupProps) => {
    const classes = useStyles();
    const [ profileImage, setProfileImage ] = useState<{ file: File, preview: string }>(null);
    

    const captureImage = (data: ChangeEvent<HTMLInputElement>) => {
        console.log('AvatarSetup captureImage:', URL.createObjectURL(data.target.files[0]));
        setProfileImage({ file: data.target.files[0], preview: URL.createObjectURL(data.target.files[0]) });
        const formData: FormData = new FormData();
        formData.append('avatar', data.target.files[0]);
    }

    const removeImage = () => {
        setProfileImage(null);
    }

    useEffect(() => {
        if (profileImage && profileImage.file) {
            const formData: FormData = new FormData();
            formData.append('avatar', profileImage.file);
            avatarChosen(formData);
        }
    }, [profileImage]);

    return (
        <div className={classes.root}>
            <div style={{ marginBottom: '10px' }}>
                Upload a Profile Picture (Optional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={profileImage ? profileImage.preview : ''} alt='Profile Picture' sx={{ width: 56, height: 56 }} />
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        multiple
                        type="file"
                        onChange={captureImage}
                    />
                    <label htmlFor="raised-button-file">
                        <Button style={{ marginLeft: '10px' }} variant='contained' component="span">
                            Upload an Image
                        </Button>
                    </label> 
                </div>
                { profileImage && (
                    <Button onClick={removeImage} style={{ width: '30px' }}>
                        Remove
                    </Button> 
                )}
            </div>
        </div>
    )
}

export default AvatarSetup;
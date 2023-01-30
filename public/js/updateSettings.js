import axios from "axios";
import {showAlert} from './alert';

export const updateData = async (data,type) => {
    try{
        const urlEndPoint = (type === 'password' ? 'updateMyPassword':'updateMe');
        const res=await axios({
            method: 'PATCH',
            url: `/api/v1/users/${urlEndPoint}`,
            data
        });

        if(res.data.status === 'succes'){
            showAlert('success',`${type.toUpperCase()} Updated successfully!`);
        }

    }
    catch(err){
        showAlert('error',err.response.data.message);
    }
}

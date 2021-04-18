import React, { useEffect, useState } from 'react';

import UsersList from '../components/UserList';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';

import { useHttpClient } from '../../shared/hooks/http-hook'; 


const Users = () => {
    const [loadedUsers, setLoadedUsers] = useState();

    const { isLoading, error, sendRequest, clearError } = useHttpClient();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const responseData = await sendRequest(
                    'https://serene-beyond-25942.herokuapp.com/api/users'
                    );
            
                setLoadedUsers(responseData.users);
            } catch (err) {}

        };
        fetchUsers();
    }, [sendRequest]);


    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError} />
            {isLoading && (
                    <div className="center">
                <LoadingSpinner />
                    </div>
                )}

            {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
            

        </React.Fragment>
    )

};

export default Users;

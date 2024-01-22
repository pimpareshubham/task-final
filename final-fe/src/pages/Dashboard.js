/* global bootstrap */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../src/config';
import { toast } from 'react-toastify';


const Dashboard = () => {

    const user = JSON.parse(localStorage.getItem('user'));


    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('');
    const [sortedUsers, setSortedUsers] = useState([]);

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        // Load filter value from local storage on component mount
        const storedFilter = localStorage.getItem('userFilter');
        if (storedFilter) {
            setFilter(storedFilter);
        }
    }, []);

    useEffect(() => {
        // Save filter value to local storage whenever it changes
        localStorage.setItem('userFilter', filter);
    }, [filter]);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, users]);


    const loadUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/all`);
            setUsers(response.data.data);
            setSortedUsers(response.data.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim() === '') {
            setSortedUsers(users);
        } else {
            const filteredUsers = users.filter(
                (user) =>
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.phone.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSortedUsers(filteredUsers);
        }
    };

    const filterUsers = (selectedFilter) => {
        let sortedUsersCopy = [...users];

        switch (selectedFilter) {
            case 'A-Z':
                sortedUsersCopy.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'Z-A':
                sortedUsersCopy.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'last-modified':
                sortedUsersCopy.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                break;
            case 'last-inserted':
                sortedUsersCopy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            default:
                break;
        }

        setSortedUsers(sortedUsersCopy);
    };

    const handleDeleteUser = async (userId) => {
        try {
            const isConfirmed = window.confirm('Are you sure you want to delete this user?');
            if (isConfirmed) {
                await axios.delete(`${API_BASE_URL}/delete/${userId}`);
                toast('User deleted successfully!')

                setUsers(users.filter((user) => user._id !== userId));
                console.log('User deleted successfully!');
            }
        } catch (error) {

            console.error('Error deleting user:', error);
        }
    };

    const handleSort = (sortBy) => {
        setFilter(sortBy);
        filterUsers(sortBy);
    };

    const handleEditUser = (userId) => {

        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user._id === userId ? { ...user, isEditing: !user.isEditing } : { ...user, isEditing: false }
            )
        );
    };

    const handleSaveEdit = async (user) => {
        try {

            // Perform the update operation on the server
            await axios.put(`${API_BASE_URL}/update/${user._id}`, user);

            // Update the local state to reflect the change
            setUsers((prevUsers) =>
                prevUsers.map((prevUser) =>
                    prevUser._id === user._id
                        ? { ...prevUser, isEditing: false, updatedAt: new Date() }
                        : prevUser
                )
            );

            toast("User updated successfully");
            console.log('User updated successfully!');
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };


    const handleAddUser = async () => {
        try {
            if (!newUser.name || !newUser.email || !newUser.phone || newUser.password) {
                // Handle the case where some fields are empty
                console.error('Please fill in all the required fields.');
                toast('Please fill in all the required fields.')
                handleShowAddUserModal();


                return;
            }

            const response = await axios.post(`${API_BASE_URL}/signup`, newUser);

            console.log('Response message:', response.data.message);

            // Reset the newUser state to clear the form fields
            setNewUser({ name: '', email: '', phone: '' });

            // Display a success message
            toast(response.data.message);

            // Reload the list of users
            loadUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            toast('Error adding user.');
        }
    };



    const handleShowAddUserModal = () => {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    };

    const handleCloseAddUserModal = () => {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.hide();
    };


    if (!user) {
        
        return (
            <div className="container not-logged-in mt-5">
                <div className='card'>Please log in to access the dashboard.</div>
              
            </div>
        );
    }

    return (
        <div className="container dashboard-container mt-5">
            <h1 className="mb-4 form-label">User Dashboard</h1>

            <div className="mt-4 mb-4">
                <label className="me-2 form-label">Filter:</label>
                <select
                    className="form-select me-3"
                    value={filter}
                    onChange={(e) => handleSort(e.target.value)}
                >
                    <option value="">None</option>
                    <option value="A-Z">A-Z</option>
                    <option value="Z-A">Z-A</option>
                    <option value="last-modified">Last Modified</option>
                    <option value="last-inserted">Last Inserted</option>
                </select>
            </div>

            {/* Search Box */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Name, Email, or Phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-primary mt-2" onClick={handleSearch}>
                    Search
                </button>
            </div>

            {/* User Listing */}
            {sortedUsers.length > 0 ? (
                <div>
                    <h2 className="form-label">User Listing</h2>
                    <div className="row row-cols-1 row-cols-md-2 g-2">
                        {sortedUsers.map((user) => (
                            <div key={user._id} className="col mb-4">
                                <div className="card">
                                    <div className="card-body">
                                        {user.isEditing ? (
                                            <div>
                                                <label>Name:</label>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    value={user.name}
                                                    onChange={(e) =>
                                                        setUsers((prevUsers) =>
                                                            prevUsers.map((u) =>
                                                                u._id === user._id ? { ...u, name: e.target.value } : u
                                                            )
                                                        )
                                                    }
                                                />
                                                <label>Email:</label>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    value={user.email}
                                                    onChange={(e) =>
                                                        setUsers((prevUsers) =>
                                                            prevUsers.map((u) =>
                                                                u._id === user._id ? { ...u, email: e.target.value } : u
                                                            )
                                                        )
                                                    }
                                                />
                                                <label>Phone:</label>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    value={user.phone}
                                                    onChange={(e) =>
                                                        setUsers((prevUsers) =>
                                                            prevUsers.map((u) =>
                                                                u._id === user._id ? { ...u, phone: e.target.value } : u
                                                            )
                                                        )
                                                    }
                                                />
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => handleSaveEdit(user)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="btn btn-secondary ms-2"
                                                    onClick={() => handleEditUser(user._id)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <h5 className="card-title">{user.name}</h5>
                                                <p className="card-text">Email: {user.email}</p>
                                                <p className="card-text">Phone: {user.phone}</p>
                                                <Link to={`/details/${user._id}`} className="btn btn-primary me-2 mt-2">
                                                    View Details
                                                </Link>
                                                <button
                                                    className="btn btn-warning me-2 mt-2"
                                                    onClick={() => handleEditUser(user._id)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger mt-2"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="form-label">No users found. Add a new user.</p>
            )}

            {/* Floating Action Button for Add User */}
            <button
                className="btn btn-primary position-fixed"
                style={{ right: 20, bottom: 10 }}
                onClick={handleShowAddUserModal}
            >
                Add User
            </button>


            


            {/* Add User Modal */}
            <div
                className={`modal fade`}
                id="addUserModal"
                tabIndex="-1"
                aria-labelledby="exampleModalLabel"


            >
                <div className="modal-dialog m">
                    <div className="modal-content m">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">
                                Add User
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                onClick={handleCloseAddUserModal}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="mb-3">
                                    <label className="form-label">Name:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        pattern="[A-Za-z ]+"
                                        required
                                    />
                                    <div>{newUser.name && !/^[A-Za-z ]+$/.test(newUser.name) && 'Only letters and spaces allowed'}</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email:</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                    />
                                </div>



                                <div className="mb-3">
                                    <label className="form-label">Phone:</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        pattern="[0-9]{10}"
                                        required
                                    />
                                    <div>{newUser.phone && !/^[0-9]{10}$/.test(newUser.phone) && 'Enter a valid 10-digit phone number'}</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password:</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        minLength="6"
                                        required
                                    />
                                    <div>{newUser.password && newUser.password.length < 6 && 'Password must be at least 6 characters long'}</div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                onClick={handleCloseAddUserModal}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                 
                                    handleAddUser();
                                }}
                            >
                                Save
                            </button>

                       
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

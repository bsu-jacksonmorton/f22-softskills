import { Pool } from 'pg';
import { User } from '../drive-permission-manager/types';

export class Users {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
        this.initDB();
    }

    /**
     * Initializes the user table if it does not exist
     * 
     * Columns:
     * - EMAIL = String email of user - is also primary key
     * - DISPLAY_NAME = Name of user (not null)
     */
    private async initDB() {
        await this.pool.query("CREATE TABLE IF NOT EXISTS Users (EMAIL TEXT PRIMARY KEY NOT NULL, "
            + "DISPLAY_NAME TEXT NOT NULL);", err => {
                if (err)
                    console.error(err);
            });
    }

    /**
     * Creates the provided user entry in the database. Returns the
     * user object created in the database. If undefined, then query
     * was unsuccessful.
     * 
     * @param user - User object to create in database
     * @param callback - Callback function to run
     * @returns - User object created in database
     */
    async create(user: User, callback?: Function): Promise<User | undefined> {
        let userOut: User | undefined;
        await this.pool.query("INSERT INTO Users (EMAIL, DISPLAY_NAME) "
            + "VALUES ('" + user.emailAddress + "', '" + user.displayName + "');", err => {
                if (err)
                    console.error(err);
                else
                    userOut = user;
                if (callback)
                    callback(userOut);
            });
        return userOut;
    }

    /**
     * Reads the user entry with the desired email
     * 
     * @param email - Email of user to find
     * @param callback - Callback function to run
     * @returns - Desired user object, or undefined if not found
     */
    async read(email: String, callback?: Function): Promise<User | undefined> {
        let user: User | undefined;
        await this.pool.query("SELECT * FROM Users WHERE EMAIL LIKE '" + email + "';", (err, res) => {
            if (err)
                console.error(err);
            else
                user = {
                    emailAddress: res.rows[0].email,
                    displayName: res.rows[0].display_name
                };
            if (callback)
                callback(user, err);
        });
        return user;
    }

    /**
     * Stores the provided updated user object in the database. Returns
     * the updated object, or undefined if unsuccessful.
     * 
     * @param user - Updated user object to store in the database
     * @param callback - Optional callback function
     * @returns - Updated user object
     */
    async update(user: User, callback?: Function): Promise<User | undefined> {
        let userOut: User | undefined;
        await this.pool.query("UPDATE Users SET EMAIL = '" + user.emailAddress
            + "', DISPLAY_NAME = '" + user.displayName + "' WHERE EMAIL ='"
            + user.emailAddress + "';", err => {
                if (err)
                    console.error(err);
                else
                    userOut = user;
                if (callback)
                    callback(userOut);
            });
        return userOut;
    }

    /**
     * Deletes the desired user from the database and returns the correscponding User object
     * 
     * @param email - Email of user to be deleted
     * @param callback - Callback function to execute after
     * @returns - Deleted User object or undefined if unsuccessful
     */
    async delete(email: String, callback?: Function): Promise<User | undefined> {
        let user: User | undefined;
        await this.pool.query("DELETE FROM Users WHERE EMAIL LIKE '" + email + "';", (err, res) => {
            if (err)
                console.error(err);
            else
                user = {
                    emailAddress: res.rows[0].email,
                    displayName: res.rows[0].display_name
                };
            if (callback)
                callback(user, err);
        });
        return user;
    }

    /**
     * Closes the pool
     */
    close(): void {
        this.pool.end();
    }
}
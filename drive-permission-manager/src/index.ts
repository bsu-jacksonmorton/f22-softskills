import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import {File, GranteeType, Permission, User, Role} from './types';
import {drive_v3, google} from 'googleapis';

interface IDrivePermissionManager{
    /**
     * Returns an array of File objects.
     * @Return [File]
     */
    getFiles(): Promise<File[]>
    /**
     * Returns an [] containing the permissions of a given fileId
     * or the permissions associated with an email address.
     * @param s File id || Email address
     * @returns [Permission] || []
     */
    getPermissions(s: string): [Permission]
    /**
     * Deletes the permission identified by permissionId from the file
     * identified by fileId.
     * @param fileId the id of the file to remove the permission from
     * @param permissionId the id of the permission to remove
     */
    deletePermission(fileId: string, permissionId: string): void
    /**
     * Adds a permission to the given File. If the GranteeType is user or group, then
     * an email address will need to be passed. If the GranteeType is domain, then a
     * domain must be provided.
     * @param file the file to add the permission to
     * @param role the role that should be granted by this permission
     * @param type the GranteeType
     * @param s the domain or email address for the domain, user, or group that the permission is for.
     */
    addPermission(file: File, role: Role, type: GranteeType, s?: string): void
}

class DrivePermissionManager implements IDrivePermissionManager {
    private drive: drive_v3.Drive
    constructor(auth: GoogleAuth){
        this.drive = google.drive({version:"v3", auth});
    }
    async getFiles(): Promise<File[]> {
        try{
        const fileList: File[] = [];
        var parentToChildrenMap = new Map();
        let NextPageToken = "";
        do {
          const params = {
            pageToken: NextPageToken || "",
            pageSize: 1000,
            fields: "nextPageToken, files(id, name, driveId, permissions, parents, kind, owners)",
            corpora: "allDrives",
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
          };
          const res = await this.drive.files.list(params);
          res.data.files.forEach((f) => {
            const permissionsList = [];
            for(const perm of f.permissions){
              let user: User = {emailAddress: perm.emailAddress, displayName: perm.displayName};
              let permission: Permission = {
                id: perm.id,
                emailAddress: perm.emailAddress,
                type: perm.type,
                role: perm.role,
                expirationDate: perm.expirationTime,
                deleted: perm.deleted,
                pendingOwner: perm.pendingOwner,
                user
              }
              permissionsList.push(permission);
            }
            let file: File = {id: f.id, name: f.name, parents:f.parents, owners: f.owners, permissions: permissionsList, kind: f.kind}
            fileList.push(file);
            if(file.parents && file.parents.length){
              for(const parentId of f.parents){
                const children = parentToChildrenMap.get(parentId);
                if(children){ // If the parent already has children
                  children.push(file.id);
                  parentToChildrenMap.set(parentId, children);
                }
                else{ // Parent doesn't get out much so no children yet
                  parentToChildrenMap.set(parentId, [file.id]);
                }
              }
            }
          });
          NextPageToken = res.data.nextPageToken;
        } while (NextPageToken);
        let parentCount = parentToChildrenMap.size;
        for(const file of fileList){
          if(parentCount){
            if(parentToChildrenMap.get(file.id)){
              file.children = parentToChildrenMap.get(file.id);
              parentCount--;
            }
          }
          else break;
        }
        return fileList;
    }
    catch(e){
        console.log(e);
    }
    };
    getPermissions: (s: string) => [Permission];
    deletePermission: (fileId: string, permissionId: string) => void;
    addPermission: (file: File, role: Role, type: GranteeType, s?: string) => void;
}

export default DrivePermissionManager;
export {IDrivePermissionManager};
export * from "./types";
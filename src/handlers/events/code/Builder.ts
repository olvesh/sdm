import { ProjectOperationCredentials, } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AppInfo } from "./Deployment";
import { Readable } from "stream";
import { ProgressLog } from "./ProgressLog";
import EventEmitter = NodeJS.EventEmitter;

// TODO do for local with child process, or output stream
export interface RunningBuild {

    readonly stream: EventEmitter;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Log output so far */
    readonly log: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitStream: Readable;

    readonly deploymentUnitFile: string;
}

export interface Builder {

    build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild>;

}

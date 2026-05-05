/* eslint-disable @typescript-eslint/no-explicit-any */
import { action, flow, makeObservable, observable } from "mobx";
import {
  FirewallDTO,
  FirewallSelection,
  RequestDTO,
  UserDTO,
  UserTaskResult,
} from "@/interfaces/Firewall";
import { AxiosError, AxiosResponse } from "axios";
import { ENV } from "@/env";
import {
  callApiBpmnServiceGet,
  callApiBpmnServicePost,
  callApiGet,
  callApiPost,
  callApiPut,
} from "../axiosCalls";
import { signOut } from "next-auth/react";
import { ProcessInstanceDTO, UserTaskDTO } from "@/interfaces/General";
import qs from "qs";

export interface OptionType {
  label: string;
  value: any;
}

const statusMap: Record<number, string> = {
  1: "Pending",
  2: "Approved",
  3: "Rejected",
};
export class GeneralStore {
  activeStep = 1;
  totalSteps = 0;
  user: UserDTO | null = null;
  firewalls: FirewallDTO[] = [];
  request: RequestDTO | null = null;
  requests: { data: RequestDTO[]; totalRecords: number } = {
    data: [],
    totalRecords: 0,
  };
  processInstance: ProcessInstanceDTO | null = null;
  processInstances: any[] = [];
  task: UserTaskDTO | null = null;
  requestStatuses: OptionType[] = [];
  selectedRequestStatus: OptionType | null = null;
  selectedRequests: OptionType | null = null;
  errors: any = null;
  loadingRequests: boolean = false;
  loadingFirewalls: boolean = false;
  loadingUser: boolean = false;
  loadingProcessInstance: boolean = false;
  loadingProcessInstances: boolean = false;
  loadingUserTask: boolean = false;
  isSubmitting: boolean = false;
  approvalTaskId: string | null = null;
  firstUserTaskId: any;
  processInfo: any;
  label: string = "DEV";

  constructor() {
    makeObservable(this, {
      activeStep: observable,
      totalSteps: observable,
      user: observable,
      firewalls: observable,
      request: observable,
      requests: observable,
      processInstance: observable,
      processInstances: observable,
      task: observable,
      requestStatuses: observable,
      selectedRequestStatus: observable,
      loadingUser: observable,
      loadingProcessInstance: observable,
      loadingProcessInstances: observable,
      loadingUserTask: observable,
      label: observable,
      onSetActiveStep: action,
      onSetTotalSteps: action,
      onSetSelectedRequestStatus: action,
      onSetLabel: action,
      getFirewalls: flow,
      getRequests: flow,
      getUser: flow,
      getProcessInstances: flow,
      getApprovalTaskByFirewallRequestId: flow,
      getProcessInstanceById: flow,
      completeUserTask: flow,
      startFirewallProcess: flow,
      onSetRequest: action,
      onSetProcessInstance: action,
      onSetUser: action,
      postFirewallRequests: flow,
      updateRequestStatus: flow,
      postFirewallRules: flow,
    });
  }

  onSetActiveStep = (data: number) => {
    this.activeStep = data;
  };
  onSetTotalSteps = (data: number) => {
    this.totalSteps = data;
  };
  onSetSelectedRequestStatus = (status: OptionType | null) => {
    this.selectedRequestStatus = status;
  };
  onSetRequest = (data: RequestDTO) => {
    this.request = data;
  };
  onSetErrors = (data: any) => {
    this.errors = data;
  };
  onSetUser = (data: UserDTO) => {
    this.user = data;
  };
  onSetProcessInstance = (data: ProcessInstanceDTO) => {
    this.processInstance = data;
  };
  onSetLabel = (data: string) => {
    this.label = data;
  };

  *postFirewallRules(
    firewallId: number,
    publicIp: string,
    duration: string,
    port: string,
    user: string,
    labelSelector: string,
  ) {
    try {
      this.onSetErrors(null);
      const payload = {
        firewallId: firewallId,
        publicIp: publicIp,
        duration: duration,
        port: port,
        user: user,
        labelSelector: labelSelector,
      };
      console.log("payload from postFirewallRules:", payload);

      const response: AxiosResponse = yield callApiPost(
        `${ENV.NEXT_PUBLIC_EDIT_FIREWALL_RULES}/${firewallId}`,
        payload,
      );

      if (response.status === 201 || response.status === 200) {
        console.log("Firewall rules updated successfully:", response.data);
      } else {
        this.onSetErrors("Failed to submit firewall rules");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError;
        this.onSetErrors(axiosErr.response?.data || "Unknown error occurred");
      } else if (err instanceof Error) {
        this.onSetErrors(err.message || "Unknown error occurred");
      }
    }
  }

  *startFirewallProcess(selectedFirewalls: FirewallSelection[]) {
    try {
      this.onSetErrors(null);
      const fw = selectedFirewalls[0];

      const payload = {
        firewallId: fw.id,
        publicIp: fw.publicIp,
        duration: fw.duration,
        requestedBy: fw.requestedBy,
        port: fw.port,
        labelSelector: fw.label,
        approved: false,
      };

      const response: AxiosResponse = yield callApiBpmnServicePost(
        `${ENV.NEXT_PUBLIC_BPMN_GET_PROCESS_DEFINITION}/key/FirewallRequestStatusUpdate/start`,
        payload,
         {
         headers: {
           "X-API-KEY": process.env.NEXT_PUBLIC_X_API_KEY,
         },
         }
      );

      if (response.status === 201 || response.status === 200) {
        console.log("Requests submitted successfully:", response.data);
        yield this.getRequests({});
      } else {
        this.onSetErrors("Failed to submit firewall requests");
      }
    } catch (err: any) {
      if (err.response?.data) {
        this.onSetErrors(err.response.data);
      } else {
        this.onSetErrors(err.message || "Unknown error occurred");
      }
    }
  }

  *completeUserTask(taskId: string, approved: boolean) {
    try {
      this.loadingUserTask = true;
      this.onSetErrors(null);
      const payload = {
        variables: {
          approved: {
            value: approved,
            type: "Boolean",
          },
        },
      };
      const response: AxiosResponse = yield callApiBpmnServicePost(
        `${ENV.NEXT_PUBLIC_BPMN_GET_TASK}/${taskId}/complete`,
        payload,
      );

      if (response.status === 204 || response.status === 200) {
        console.log("User task completed successfully");
      }

      this.loadingUserTask = false;
    } catch (err: any) {
      this.loadingUserTask = false;
      if (err.response?.status === 401) {
        try {
          yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
        } catch {}
      } else if (err.response?.data) {
        this.onSetErrors(err.response.data);
      } else {
        this.onSetErrors(err.message);
      }
    }
  }

  *getProcessInstances(payload: any) {
    try {
      this.onSetErrors(null);
      this.loadingProcessInstances = true;
      const queryString = qs.stringify(payload, { encode: true });

      const response: AxiosResponse = yield callApiBpmnServiceGet(
        `${ENV.NEXT_PUBLIC_BPMN_GET_PROCESS_INSTANCE}/documents/paging?${queryString}`,
      );

      // http://localhost:63108/api/process-instance/documents/paging?draw=1&start=0&length=28&
      // collection=WorkflowInstance&columns[0][name]=_id&columns[0][include]=true&columns[1][name]=Name&
      // columns[1][include]=true&columns[2][name]=Status&columns[2][include]=true&columns[3][name]=WorkflowData&
      // columns[3][include]=true&columns[4][name]=Name&columns[4][searchable]=true&columns[4][search][value]=FirewallRequestStatusUpdate&
      // columns[4][search][regex]=false&order[0][column]=0&order[0][dir]=desc

      if (response.status === 200) {
        this.loadingProcessInstances = false;
        this.processInstances = response.data.results || [];
        this.processInfo = response.data.info;
      }
    } catch (err: any) {
      this.loadingProcessInstances = false;
      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          try {
            yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
          } catch (error) {}
        } else {
          this.onSetErrors(err.response.data);
        }
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
    }
  }
  *getApprovalTaskByFirewallRequestId(id: string) {
    try {
      this.onSetErrors(null);
      const payloadInstances = {
       draw: 1,
       start: 0,
       length: 100,
       collection: "WorkflowInstance",
     
       "columns[0][name]": "_id",
       "columns[0][include]": true,
     
       "columns[1][name]": "Name",
       "columns[1][include]": true,
       "columns[1][searchable]": true,
       "columns[1][search][value]": "FirewallRequestStatusUpdate",
       "columns[1][search][regex]": false,
     
       "columns[2][name]": "Status",
       "columns[2][include]": true,
       "columns[2][searchable]": true,
       "columns[2][search][value]": "Paused",
       "columns[2][search][regex]": false,
     
       "columns[3][name]": "WorkflowData",
       "columns[3][include]": true,
     };

       yield this.getProcessInstances(payloadInstances);
      const match = this.processInstances.find(
        (i: any) => i.workflowData?.firewall?.data?.id === id,
      );
      console.log("looking for id:", id);
      console.log(
        "first instance firewall id:",
        this.processInstances[0]?.workflowData?.firewall?.data?.id,
      );
      console.log('match', match)

      if (!match) {
        console.warn(
          "No paused workflow instance found for firewall request",
          id,
        );
        return null;
      }
      console.log(
        "match:",
        this.processInstances.find(
          (i: any) => i.workflowData?.firewall?.data?.id === id,
        ),
      );
      const instanceId = match._id;

      const payload = {
        draw: 1,
        start: 0,
        length: 100,
        collection: "UserTask",
        "columns[0][name]": "_id",
        "columns[0][include]": true,
        "columns[1][name]": "InstanceId",
        "columns[1][include]": true,
        "columns[2][name]": "Status",
        "columns[2][include]": true,
        "columns[2][searchable]": true,
        "columns[2][search][value]": "Created",
        "columns[2][search][regex]": false,
        "columns[3][name]": "AssignedTo",
        "columns[3][include]": true,
        "order[0][column]": "0",
        "order[0][dir]": "desc",
      };

      const queryString = qs.stringify(payload, { encode: true });

      const response: AxiosResponse = yield callApiBpmnServiceGet(
        `${ENV.NEXT_PUBLIC_BPMN_GET_PROCESS_INSTANCE}/documents/paging?${queryString}`,
      );

      if (response.status === 200) {
        const tasks: UserTaskResult[] = response.data.results || [];
        const task = tasks.find((t) => t.instanceId === instanceId);
        return task?._id ?? null;
      }

      return null;
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
        } catch {}
      } else if (err.response?.data) {
        this.onSetErrors(err.response.data);
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
      return null;
    }
  }

  *getProcessInstanceById(id: string) {
    try {
      this.onSetErrors(null);
      this.loadingProcessInstance = true;

      const response: AxiosResponse = yield callApiBpmnServiceGet(
        `${ENV.NEXT_PUBLIC_BPMN_GET_PROCESS_INSTANCE}/${id}`,
      );

      if (response.status === 200) {
        this.loadingProcessInstance = false;
        this.processInstance = response.data;
      }
    } catch (err: any) {
      this.loadingProcessInstance = false;
      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          try {
            yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
          } catch (error) {}
          // clearStorage();
          // signOut();
        } else {
          this.onSetErrors(err.response.data);
        }
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
    }
  }

  *getRequests(payload: any) {
    try {
      this.onSetErrors(null);
      this.loadingRequests = true;

      const params = new URLSearchParams();

      if (payload.filters?.requestStatusId) {
        const statusString = statusMap[payload.filters.requestStatusId];
        if (statusString) {
          params.append("status", statusString);
        }
      }
      if (payload.page) {
        params.append("pageSize", String(payload.page.pageSize));
        params.append("pageNumber", String(payload.page.pageNumber));
      }

      const url = `${
        ENV.NEXT_PUBLIC_GET_FIREWALL_REQUESTS
      }?${params.toString()}`;

      const response: AxiosResponse = yield callApiGet(url);
      if (response.status === 200) {
        this.loadingRequests = false;
        this.requests = response.data;
      }
    } catch (err: any) {
      this.loadingRequests = false;
      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          try {
            yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
          } catch (error) {}
          // clearStorage();
          // signOut();
        } else {
          this.onSetErrors(err.response.data);
        }
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
    }
  }

  *getFirewalls(label?: string) {
    try {
      this.onSetErrors(null);
      this.loadingFirewalls = true;
      this.onSetLabel(label || "DEV");
      const response: AxiosResponse = yield callApiGet(
        `${ENV.NEXT_PUBLIC_GET_FIREWALLS}${label ? `?label=${label}` : ""}`,
      );

      if (response.status === 200) {
        this.loadingFirewalls = false;
        this.firewalls = response.data;
      }
    } catch (err: any) {
      this.loadingFirewalls = false;
      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          try {
            yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
          } catch (error) {}
          // clearStorage();
          // signOut();
        } else {
          this.onSetErrors(err.response.data);
        }
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
    }
  }
  *postFirewallRequests(selectedFirewalls: FirewallSelection[]) {
    try {
      this.onSetErrors(null);
      const fw = selectedFirewalls[0];

      const payload = {
        FirewallId: fw.id,
        PublicIp: fw.publicIp,
        Duration: fw.duration,
        RequestedBy: fw.requestedBy,
        CreatedAt: fw.created ?? new Date().toISOString(),
        Name: fw.name ?? "",
        Labels: fw.labels ?? "",
      };
      const response: AxiosResponse = yield callApiPost(
        ENV.NEXT_PUBLIC_CREATE_FIREWALL_REQUEST,
        payload,
      );

      if (response.status === 201 || response.status === 200) {
        console.log("Requests submitted successfully:", response.data);
        yield this.getRequests({});
      } else {
        this.onSetErrors("Failed to submit firewall requests");
      }
    } catch (err: any) {
      if (err.response?.data) {
        this.onSetErrors(err.response.data);
      } else {
        this.onSetErrors(err.message || "Unknown error occurred");
      }
    }
  }
  *updateRequestStatus(id: string, action: "approve" | "reject") {
    try {
      const status = action === "approve" ? "Approved" : "Rejected";

      const requestBody = {
        requestId: id,
        status,
      };
      const url = `${ENV.NEXT_PUBLIC_EDIT_FIREWALL_REQUEST}`;
      const res: AxiosResponse = yield callApiPut(url, requestBody);

      if (res.status === 204) {
        yield this.getRequests({});
      } else {
        this.onSetErrors(`Failed to ${action} request`);
      }
    } catch (err: any) {
      this.onSetErrors(err.response?.data || err.message);
    }
  }
  *getUser(azureAdId: string) {
    try {
      this.onSetErrors(null);
      this.loadingUser = true;
      const response: AxiosResponse = yield callApiGet(
        `${ENV.NEXT_PUBLIC_GET_USER}/${azureAdId}`,
      );

      if (response.status === 200) {
        this.loadingUser = false;
        this.user = response.data;
      }
    } catch (err: any) {
      this.loadingUser = false;

      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          try {
            yield callApiGet(ENV.NEXT_PUBLIC_LOGOUT);
          } catch (error) {}
          //clearStorage();
          signOut();
        } else {
          this.onSetErrors(err.response.data);
        }
      } else if (err.message) {
        this.onSetErrors(err.message);
      }
    }
  }
  *createUserWithData(userData: UserDTO) {
    try {
      this.onSetErrors(null);
      this.loadingUser = true;

      const response: AxiosResponse = yield callApiPost(
        ENV.NEXT_PUBLIC_CREATE_USER,
        { userDto: userData },
      );

      if (response.status === 200 || response.status === 201) {
        this.user = response.data;
        console.log("User created successfully:", response.data);
      } else {
        this.onSetErrors("Failed to create user");
      }

      this.loadingUser = false;
    } catch (err: any) {
      this.loadingUser = false;

      if (err.response && err.response.data) {
        this.onSetErrors(err.response.data);
      } else if (err.message) {
        this.onSetErrors(err.message);
      } else {
        this.onSetErrors("Unknown error occurred while creating user");
      }
    }
  }
}

import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalListComponent } from "src/app/shared/global-list";
import { ApiService } from "src/app/services/api.service";
import { IConnection } from "src/app/Models/connection";

@Component({
  selector: "app-manage-model",
  templateUrl: "./manage-model.component.html",
  styleUrls: ["./manage-model.component.scss"],
})
export class ManageModelComponent
  extends GlobalListComponent
  implements OnInit
{
  constructor(
    protected override router: Router,
    protected override _route: ActivatedRoute,
    protected formbuilder: FormBuilder,
    private apiService: ApiService
  ) {
    super(router, _route);

    this.tableProps = {
      colHeader: {
        checkbox: "",
        Name: "Name",
        icon: "Connectors",
        status: "Status",
        endpointUrl: "EndPoint Url",
        lastupdated: "Last Updated",
        actions: "Quick Actions",
      },
      columnTypes: {
        Name: "Name",
        icon: "icon",
        actions: "actionsSeperate",
        status: "statusToShow",
        endpointUrl: "endpointUrl",
        lastupdated: "lastupdated",
      },
      statusConfig: [
        {
          status: "Running",
          color: "white",
          backgroundColor: "#005F65",
        },
      ],
      rowActions: [
        {
          label: null,
          type: "delete",
          visibility: true,
          isCustom: false,
          background: "transparent",
          color: "black",
          icon: "delete_forever",
        },
        {
          label: null,
          type: "edit",
          visibility: true,
          isCustom: false,
          background: "transparent",
          color: "black",
          icon: "edit",
        },
        {
          label: null,
          type: "copy",
          visibility: true,
          isCustom: false,
          background: "transparent",
          color: "black",
          icon: "file_copy",
        },
      ],
    };
  }

  override async ngOnInit(): Promise<void> {
    const connections: any = await this.apiService
      .getAllConnections()
      .toPromise();
    let dataEndpoints: any = [];
    console.log("response:", connections);
    connections.forEach((connection: IConnection) => {
      const tables = JSON.parse(connection.tables);
      tables.forEach(
        (table: {
          name: string;
          collections: Array<{
            collectionName: string;
            headers: string;
            status: boolean;
          }>;
        }) => {
          table.collections.forEach(
            (collection: {
              collectionName: string;
              headers: string;
              status: boolean;
            }) => {
              dataEndpoints.push({
                type:'connection',
                Name: collection.collectionName,
                status: "Running",
                icon: [`assets/logos/${connection.type.toLowerCase()}.png`],
                endpointUrl: connection.host,
                description: collection.collectionName,
                text: connection.type,
                headers: collection.headers,
                dbname: table.name,
                lastupdated: connection.updatedAt,
              });
            }
          );
        }
      );
    });

    const models: any = await this.apiService.getModels().toPromise();
    models.forEach((model: any) => {
      let icons: string[] = []
      const connectors = JSON.parse(model.nodeData);
      connectors.forEach((connector:any)=>{
        icons.push(connector.source)
      })
      dataEndpoints.push({
        id: model._id,
        type:'model',
        Name: model.name,
        status: "Running",
        icon: icons,
        endpointUrl: model.host,
        description: model.name,
        text: model.type,
        headers: model.headers,
        dbname: model.dbname,
        diagramData: model.diagramData,
        lastupdated: model.updatedAt,
      });
    });

    this.allDataItems = dataEndpoints;
    this.dataItems = dataEndpoints.slice(0, this.pagination.perPage);
    this.pagination.pages = Math.floor(
      dataEndpoints.length / this.pagination.perPage + 1
    );
    this.pagination.count = dataEndpoints.length;
    console.log(
      "dataEndpoints:",
      dataEndpoints
    );
  }
}

import {
  CdkDragDrop,
  copyArrayItem,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
} from "@angular/core";
import { Config } from "src/config";
import { EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { DiagramComponent } from "./diagram/diagram.component";
import { ApiService } from "src/app/services/api.service";
import { NotifierService } from "angular-notifier";
import { ActivatedRoute } from "@angular/router";

import * as go from "gojs";

const $ = go.GraphObject.make;

@Component({
  selector: "app-new-model",
  templateUrl: "./new-model.component.html",
  styleUrls: ["./new-model.component.scss"],
})
export class NewModelComponent implements AfterViewInit {
  @Output() setJoinedTable: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(DiagramComponent) diagram: DiagramComponent;
  @ViewChild("modelName") modelName: ElementRef;
  private readonly notifier: NotifierService;

  availableConnections: any[] = [];
  defaultPlaceholder: string = Config.default_placeholder;
  tableProps: any;
  dataSource: any[] = [];
  models: any[] = [];
  isExpanded: boolean = true;
  isLocked: boolean = false;

  public model: go.GraphLinksModel = new go.GraphLinksModel({
    copiesArrays: true,
    copiesArrayObjects: true,
    linkFromPortIdProperty: "fromPort",
    linkToPortIdProperty: "toPort",
    nodeDataArray: [
      {
        key: 1,
        name: "Server",
        inservices: [{ name: "s1" }, { name: "s2" }],
        outservices: [{ name: "o1" }],
        loc: "0 0",
      },
      {
        key: 2,
        name: "Other",
        inservices: [{ name: "s1" }, { name: "s2" }],
        loc: "200 60",
      },
    ],
    linkDataArray: [{ from: 1, fromPort: "o1", to: 2, toPort: "s2" }],
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private route: ActivatedRoute,

    notifierService: NotifierService
  ) {
    this.notifier = notifierService;

    this.availableConnections = [
      {
        img: "assets/logos/Epicor.png",
        name: "EPICOR",
      },
      {
        img: "assets/logos/adp.png",
        name: "ADP",
      },
      {
        img: "assets/logos/Epson.png",
        name: "EPSON",
      },
      {
        img: "assets/logos/sap.png",
        name: "SAP",
      },
      {
        img: "assets/logos/Hubspot.png",
        name: "Hubspot",
      },
      {
        img: "assets/logos/kronos.png",
        name: "KRONOS",
      },
      {
        img: "assets/logos/Salesforce.png",
        name: "salesforce",
      },
      {
        img: "assets/logos/Oracle.png",
        name: "Oracle",
      },
    ];

    this.tableProps = {
      colHeader: {},
      columnTypes: {},
    };

    // this.dataSource = [
    //   {
    //     instance: "flow - [2339]",
    //     timestramp: "april 30, 2023, 11:25:22 aM",
    //     message:
    //       "Lorem ipsum dolor sit amet consectetur. Urna non adipiscing neque odio. Nunc non vitae quis enim leo.",
    //   },
    //   {
    //     instance: "flow - [2339]",
    //     timestramp: "april 30, 2023, 11:25:22 aM",
    //     message:
    //       "Lorem ipsum dolor sit amet consectetur. Urna non adipiscing neque odio. Nunc non vitae quis enim leo.",
    //   },
    //   {
    //     instance: "flow - [2339]",
    //     timestramp: "april 30, 2023, 11:25:22 aM",
    //     message:
    //       "Lorem ipsum dolor sit amet consectetur. Urna non adipiscing neque odio. Nunc non vitae quis enim leo.",
    //   },
    //   {
    //     instance: "flow - [2339]",
    //     timestramp: "april 30, 2023, 11:25:22 aM",
    //     message:
    //       "Lorem ipsum dolor sit amet consectetur. Urna non adipiscing neque odio. Nunc non vitae quis enim leo.",
    //   },
    // ];
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const id = this.route.snapshot.paramMap.get("id");
      if (id) {
        this.apiService.getModel(id).subscribe((res) => {
          // console.log('res from model data', res.diagramData);
          // console.log('diagram.diagram.model:', this.diagram)
          this.diagram.diagram.model = go.Model.fromJson(
            JSON.parse(res.diagramData)
          );
          this.modelName.nativeElement.value = res.name;
        });
      }
    }, 1000);
  }

  onlockclicked($event: any) {
    this.isLocked = !this.isLocked;
    this.diagram.onLockClicked(this.isLocked);
  }

  onSaveclicked(modelName: string) {
    console.log("clicked save button!:", modelName);
    const diagramData = this.diagram.diagram.model.toJson();
    localStorage.setItem("diagramData", diagramData);
    if (modelName !== "") {
      if (this.diagram.checkSaveAvailablity()) {
        const node = this.diagram.diagram.nodes.first();
        if (node) {
          console.log("node", node.data);
          const allConnectedNodes = this.diagram.getAllConnectedNodes(node);

          const modelData: any = {
            name: modelName,
            host: "neuclongenmongodb.mongo.cosmos.azure.com",
            nodeData: JSON.stringify(allConnectedNodes),
            diagramData: diagramData,
          };
          const id = this.route.snapshot.paramMap.get("id");

          if (id) {
            modelData["_id"] = id;
          }
          this.apiService.saveModel(modelData).subscribe((res) => {
            console.log("res from getJoinedTableData", res);
          });
        }
        this.notifier.notify("success", "Your model saved successfully");
      } else {
        this.notifier.notify(
          "error",
          "You can't save your model now, please check your model"
        );
      }
    } else {
      this.notifier.notify("error", "Input your Model Name");
    }
  }

  onSetJoinedtable(joinedTable: any) {
    this.dataSource = joinedTable;
    const headers = Object.keys(joinedTable[0]);
    console.log("headers", headers);
    this.tableProps = {
      colHeader: headers.reduce((obj: any, header: string) => {
        obj[header] = header;
        return obj;
      }, {}),

      columnTypes: {},
    };
    // this.cdr.detectChanges();
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      copyArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}

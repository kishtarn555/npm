import { EditorView } from 'codemirror'
import { Compartment } from '@codemirror/state'
import bootstrap from 'bootstrap';
import { WorldRenderer, WRStyle } from '../worldRenderer';
import { WorldViewController, Gizmos } from "../worldViewController/worldViewController";
import { World } from '../../../js/karel';
import { ControllerState, KarelController } from '../KarelController';
import { GetOrCreateInstanceFactory } from 'bootstrap/js/dist/base-component';
import { freezeEditors, unfreezeEditors } from '../editor/editor';
import { ContextMenuData, DesktopContextMenu } from './contextMenu';
import { BeeperToolbar, EvaluateToolbar, KarelToolbar, WallToolbar } from './commonTypes';
import { CallStack, CallStackUI } from './callStack';
import { ConsoleTab, KarelConsole } from './console';
import { DefaultWRStyle } from '../KarelStyles';


type FocusToolbar = {
    origin: JQuery,
    karel: JQuery,
    selector: JQuery,
    
}

type ExecutionToolbar = {
    reset: JQuery,
    compile: JQuery,
    run: JQuery,
    step: JQuery,
    future: JQuery,
}


interface DesktopElements {
    desktopEditor: EditorView
    worldContainer: JQuery,
    worldCanvas: JQuery,
    gizmos: Gizmos,
    worldZoom: JQuery,
    lessZoom: JQuery,
    moreZoom: JQuery,
    controlBar: {
        execution: ExecutionToolbar,
        beeperInput: JQuery,
        infiniteBeeperInput: JQuery,
        delayInput: JQuery,
        delayAdd: JQuery,
        delayRemove: JQuery,
    },
    toolbar: {
        beepers: BeeperToolbar
        karel: KarelToolbar
        wall: WallToolbar
        focus: FocusToolbar
        evaluate: EvaluateToolbar
    },
    context: ContextMenuData,
    console: ConsoleTab,
    callStack: CallStackUI
};

class DesktopController {
    editor: EditorView;

    worldContainer: JQuery;
    worldCanvas: JQuery;
    worldZoom: JQuery;
    lessZoom: JQuery;
    moreZoom: JQuery;
    
    executionReset : JQuery;
    executionCompile : JQuery;
    executionRun : JQuery;
    executionStep : JQuery;
    executionEnd : JQuery;

    beeperBagInput: JQuery
    infiniteBeeperInput: JQuery

    delayInput: JQuery
    delayAdd: JQuery
    delayRemove: JQuery

    beeperToolbar: BeeperToolbar;
    karelToolbar: KarelToolbar;
    wallToolbar: WallToolbar;
    evaluateToolbar: EvaluateToolbar;

    focusToolbar: FocusToolbar;


    contextMenu: DesktopContextMenu

    worldController: WorldViewController;
    karelController: KarelController;

    console:KarelConsole
    callStack: CallStack

    private isControlInPlayMode: boolean
    
    constructor (elements: DesktopElements, karelController: KarelController) {
        this.editor = elements.desktopEditor;
        this.worldContainer = elements.worldContainer;
        this.worldCanvas = elements.worldCanvas;
        this.worldZoom = elements.worldZoom;
        this.lessZoom = elements.lessZoom;
        this.moreZoom = elements.moreZoom;

        this.executionReset = elements.controlBar.execution.reset;
        this.executionCompile = elements.controlBar.execution.compile;
        this.executionRun = elements.controlBar.execution.run;
        this.executionStep = elements.controlBar.execution.step;
        this.executionEnd = elements.controlBar.execution.future;

        this.beeperBagInput = elements.controlBar.beeperInput;
        this.infiniteBeeperInput = elements.controlBar.infiniteBeeperInput;

        this.delayInput = elements.controlBar.delayInput;
        this.delayAdd = elements.controlBar.delayAdd;
        this.delayRemove = elements.controlBar.delayRemove;

        this.beeperToolbar = elements.toolbar.beepers;
        this.karelToolbar = elements.toolbar.karel;
        this.wallToolbar = elements.toolbar.wall;
        this.evaluateToolbar = elements.toolbar.evaluate;

        this.focusToolbar = elements.toolbar.focus;

        // this.contextToggler = elements.context.toggler;
        // this.contextContainer = elements.context.container;
        // this.contextBeepers = elements.context.beepers;
        // this.contextKarel = elements.context.karel;        
        // this.contextWall = elements.context.wall;

        
        this.console =  new KarelConsole(elements.console);
        
        this.karelController = karelController;
        
        this.worldController = new WorldViewController(
            new WorldRenderer(
                (this.worldCanvas[0] as HTMLCanvasElement).getContext("2d"),
                DefaultWRStyle,
                1
            ),
            karelController,
            elements.worldContainer[0],
            elements.gizmos
        );
        this.contextMenu = new DesktopContextMenu(elements.context, elements.worldCanvas, this.worldController);
        this.karelController.RegisterStateChangeObserver(this.OnKarelControllerStateChange.bind(this));

        this.isControlInPlayMode = false;
        this.callStack = new CallStack(elements.callStack);

    }

    Init() {
        $(window).on("resize", this.ResizeCanvas.bind(this));
        $(window).on("focus", this.ResizeCanvas.bind(this));
        $(window).on("keydown", this.HotKeys.bind(this));

        this.worldContainer.on("scroll", this.calculateScroll.bind(this));
        $("body").on(
            "mouseup",
            this.worldController.ClickUp.bind(this.worldController)
        );
        this.worldCanvas.on(
            "mousemove",
            this.worldController.TrackMouse.bind(this.worldController)
        );
        this.worldCanvas.on(
            "mousedown",
            this.worldController.ClickDown.bind(this.worldController)
        );
        

        const zooms = ["0.5", "0.75", "1", "1.5", "2.0", "2.5", "4"]
        this.worldZoom.on("change", ()=> {
            let scale = parseFloat(String(this.worldZoom.val()));
            this.worldController.SetScale(scale);
        });
        this.lessZoom.on("click", ()=> {
            let val = String(this.worldZoom.val());
            let nzoom = zooms.indexOf(val)-1;
            if (nzoom < 0)nzoom=0;
            this.worldZoom.val( zooms[nzoom]).trigger('change');;
        });
        this.moreZoom.on("click", ()=> {
            let val = String(this.worldZoom.val());
            let nzoom = zooms.indexOf(val)+1;
            if (nzoom >= zooms.length)nzoom=zooms.length-1;
            this.worldZoom.val( zooms[nzoom]).trigger('change');;
        });

        this.ConnectExecutionButtonGroup();

        this.ConnectToolbar();        
        
        this.ResizeCanvas();
        this.worldController.FocusOrigin();
        this.ConnectConsole();
    }


    private ConnectExecutionButtonGroup() {
        this.executionCompile.on("click", ()=>this.karelController.Compile());
        this.executionReset.on("click", ()=>this.ResetExecution());
        this.executionStep.on("click", ()=>this.Step());
        this.executionEnd.on("click", ()=> this.RunTillEnd());
        this.executionRun.on("click", ()=> {
            if (!this.isControlInPlayMode) {
                this.AutoStep();
            } else {
                this.PauseStep();
            }            
        });
        this.delayInput.on("change", () => {
            let delay:number = parseInt(this.delayInput.val() as string);
            this.karelController.ChangeAutoStepDelay(delay);
        });

        this.delayAdd.on("click", ()=>{            
            let delay:number = parseInt(this.delayInput.val() as string);
            delay += 50;
            this.delayInput.val(delay);
            this.karelController.ChangeAutoStepDelay(delay);
        });
        this.delayRemove.on("click", ()=>{            
            let delay:number = parseInt(this.delayInput.val() as string);
            delay -= 50;
            delay = delay < 0 ? 0:delay;
            this.delayInput.val(delay);
            this.karelController.ChangeAutoStepDelay(delay);
        });
        this.beeperBagInput.on("change", () => this.OnBeeperInputChange());
        this.infiniteBeeperInput.on("click", () => this.ToggleInfiniteBeepers());
        this.karelController.RegisterStepController((_ctr, _state)=> {this.UpdateBeeperBag()})
        this.karelController.RegisterNewWorldObserver((_ctr, _state, _newInstance)=> {this.UpdateBeeperBag()})
    }
    
    private UpdateBeeperBag() {
        const amount = this.worldController.GetBeepersInBag()
        
        this.beeperBagInput.val(amount);
        if (amount === -1) {
            this.ActivateInfiniteBeepers();
        } else {
            this.DeactivateInfiniteBeepers();
        }
    }

    private ActivateInfiniteBeepers() {
        this.beeperBagInput.hide();
        this.infiniteBeeperInput.removeClass("btn-body");
        this.infiniteBeeperInput.addClass("btn-info");
    }

    
    private DeactivateInfiniteBeepers() {
        this.beeperBagInput.show();
        this.infiniteBeeperInput.removeClass("btn-info");
        this.infiniteBeeperInput.addClass("btn-body");
    }


    private ToggleInfiniteBeepers() {
        if (this.worldController.GetBeepersInBag() !== -1) {
            this.ActivateInfiniteBeepers();
            this.worldController.SetBeepersInBag(-1);
        } else {
            this.DeactivateInfiniteBeepers();
            this.worldController.SetBeepersInBag(0);
            this.UpdateBeeperBag();

        }
    }
    
    private OnBeeperInputChange() {
        if (this.karelController.GetState() !== "unstarted") {
            return;
        }
        let beeperAmmount = parseInt(this.beeperBagInput.val() as string);
        this.worldController.SetBeepersInBag(beeperAmmount);
    }

    private ResetExecution() {
        this.karelController.Reset();
        this.UpdateBeeperBag();
    }
    
    private AutoStep() {
        let delay:number = parseInt(this.delayInput.val() as string);
        this.karelController.StartAutoStep(delay);
        this.SetPlayMode();
    }
    
    private PauseStep() {
        this.karelController.Pause();
    }

    private RunTillEnd() {
        this.karelController.RunTillEnd();        
        this.UpdateBeeperBag();
    }
    private Step() {
        this.karelController.Step();
        this.UpdateBeeperBag();
    }

    private DisableControlBar() {
        this.executionCompile.attr("disabled", "");
        this.executionRun.attr("disabled", "");
        this.executionStep.attr("disabled", "");
        this.executionEnd.attr("disabled", "");
        this.beeperBagInput.attr("disabled", "");
        this.infiniteBeeperInput.attr("disabled", "");
    }

    
    private EnableControlBar() {
        this.executionCompile.removeAttr("disabled");
        this.executionRun.removeAttr("disabled");
        this.executionStep.removeAttr("disabled");
        this.executionEnd.removeAttr("disabled");
        this.beeperBagInput.removeAttr("disabled");
        this.infiniteBeeperInput.removeAttr("disabled");

        
        this.executionRun.html('<i class="bi bi-play-fill"></i>');
    }

    private SetPlayMode() {
        this.isControlInPlayMode = true;

        this.executionCompile.attr("disabled", "");
        this.executionStep.attr("disabled", "");
        this.executionEnd.attr("disabled", "");
        this.beeperBagInput.attr("disabled", "");
        this.infiniteBeeperInput.attr("disabled", "");

        
        this.executionRun.html('<i class="bi bi-pause-fill"></i>');
    }

    
    private SetPauseMode() {
        this.isControlInPlayMode = false;

        this.executionCompile.attr("disabled", "");
        this.beeperBagInput.attr("disabled", "");
        this.infiniteBeeperInput.attr("disabled", "");

        this.executionStep.removeAttr("disabled");
        this.executionEnd.removeAttr("disabled");
        this.executionRun.removeAttr("disabled");
        
        this.executionRun.html('<i class="bi bi-play-fill"></i>');
    }

    private OnKarelControllerStateChange(sender: KarelController, state: ControllerState) {
        if (state === "running") {            
            freezeEditors(this.editor);
            this.SetPauseMode();
            this.worldController.Lock();
        }
        if (state === "finished") {
            this.isControlInPlayMode = false;
            this.DisableControlBar();
            if (this.karelController.EndedOnError()) {
                this.worldController.ErrorMode();
            }
            freezeEditors(this.editor);
            
            this.worldController.Lock();

        } else if (state === "unstarted") {            
            this.isControlInPlayMode = false;

            this.EnableControlBar();
            unfreezeEditors(this.editor);
            this.worldController.UnLock();

            this.worldController.NormalMode();
            this.UpdateBeeperBag();
        } else if (state === "paused") {
            this.SetPauseMode();
        }
    }

    private ConnectToolbar() {        
        this.beeperToolbar.addOne.on("click", ()=>this.worldController.ChangeBeepers(1));
        this.beeperToolbar.removeOne.on("click", ()=>this.worldController.ChangeBeepers(-1));        
        this.beeperToolbar.infinite.on("click", ()=>this.worldController.SetBeepers(-1));
        this.beeperToolbar.clear.on("click", ()=>this.worldController.SetBeepers(0));

        this.karelToolbar.north.on("click", ()=>this.worldController.SetKarelOnSelection("north"));
        this.karelToolbar.east.on("click", ()=>this.worldController.SetKarelOnSelection("east"));
        this.karelToolbar.south.on("click", ()=>this.worldController.SetKarelOnSelection("south"));
        this.karelToolbar.west.on("click", ()=>this.worldController.SetKarelOnSelection("west"));
        
        this.wallToolbar.north.on("click", ()=>this.worldController.ToggleWall("north"));
        this.wallToolbar.east.on("click", ()=>this.worldController.ToggleWall("east"));
        this.wallToolbar.south.on("click", ()=>this.worldController.ToggleWall("south"));
        this.wallToolbar.west.on("click", ()=>this.worldController.ToggleWall("west"));
        this.wallToolbar.outside.on("click", ()=>this.worldController.ToggleWall("outer"));

        this.focusToolbar.karel.on("click", ()=>this.worldController.FocusKarel());
        this.focusToolbar.origin.on("click", ()=>this.worldController.FocusOrigin());
        this.focusToolbar.selector.on("click", ()=>this.worldController.FocusSelection());

        this.evaluateToolbar.evaluate.on("click", ()=> this.worldController.SetCellEvaluation(true));
        this.evaluateToolbar.ignore.on("click", ()=> this.worldController.SetCellEvaluation(false));
    }


    

    private ConnectConsole() {        
        this.karelController.RegisterMessageCallback(this.ConsoleMessage.bind(this));
    }
    

    public ConsoleMessage(message: string, type:"info"|"success"|"error"|"raw" = "info") {
        let style="info";
        switch (type) {
            case "info":
                style = "info";
                break;
            case "success":
                style = "success";
                break;
                case  "error":
                    style="danger";
                    break;
            case "raw":
                style="raw";
                break;
        }        
        this.console.SendMessageToConsole(message, style);
    }

    

    private HotKeys(e: JQuery.KeyDownEvent) {
        let tag = e.target.tagName.toLowerCase();
        if (document.activeElement.getAttribute("role")=="textbox" || tag=="input") {
            return;
        }

        const overrideShift = new Set<number>([37, 38, 39, 40]);

        let hotkeys = new Map<number, ()=>void>([
            [71,()=>{this.worldController.ToggleKarelPosition();}],
            [82,()=>{this.worldController.SetBeepers(0);}],
            [81,()=>{this.worldController.ChangeBeepers(-1);}],
            [69,()=>{this.worldController.ChangeBeepers(1);}],
            [48,()=>{this.worldController.SetBeepers(0);}],
            [49,()=>{this.worldController.SetBeepers(1);}],
            [50,()=>{this.worldController.SetBeepers(2);}],
            [51,()=>{this.worldController.SetBeepers(3);}],
            [52,()=>{this.worldController.SetBeepers(4);}],
            [53,()=>{this.worldController.SetBeepers(5);}],
            [54,()=>{this.worldController.SetBeepers(6);}],
            [55,()=>{this.worldController.SetBeepers(7);}],
            [56,()=>{this.worldController.SetBeepers(8);}],
            [57,()=>{this.worldController.SetBeepers(9);}],
            [67,()=>{$("#desktopSetAmmount").trigger("click")}], // FIXME
            [87,()=>{this.worldController.ToggleWall("north");}],
            [68,()=>{this.worldController.ToggleWall("east");}],
            [83,()=>{this.worldController.ToggleWall("south");}],
            [65,()=>{this.worldController.ToggleWall("west");}],
            [88,()=>{this.worldController.ToggleWall("outer");}],
            [37,()=>{this.worldController.MoveSelection(0,-1, e.shiftKey);} ],
            [38,()=>{this.worldController.MoveSelection(1, 0, e.shiftKey);}],
            [39,()=>{this.worldController.MoveSelection(0, 1, e.shiftKey);}],
            [40,()=>{this.worldController.MoveSelection(-1, 0, e.shiftKey);}],
            [84,()=>{this.worldController.SetBeepers(-1);}],
            [90,()=>{this.worldController.SetCellEvaluation(true);}],
            [86,()=>{this.worldController.SetCellEvaluation(false);}],
            
        ]);
        if (hotkeys.has(e.which) === false) {
            return;
        }     
        
        if (e.shiftKey && !overrideShift.has(e.which)) {
            let dummy: MouseEvent = new MouseEvent("", {
                clientX: e.clientX,
                clientY: e.clientY
            });
            this.worldController.ClickDown(dummy);
            this.worldController.ClickUp(dummy);
        }
        hotkeys.get(e.which)();
        e.preventDefault();
    }

    private calculateScroll() {
        let left = 0, top=1;
        const container = this.worldContainer[0];
        if (container.scrollWidth !== container.clientWidth) {
            left = container.scrollLeft / (container.scrollWidth - container.clientWidth);
        }
        if(container.scrollHeight !== container.clientHeight) {
            top = 
                1 - container.scrollTop
                / (container.scrollHeight - container.clientHeight);
        }
        this.worldController.UpdateScroll(left, top);
    }

    public ResizeCanvas() {
        this.worldCanvas[0].style.width = `${this.worldContainer[0].clientWidth}px`;    
        this.worldCanvas[0].style.height = `${this.worldContainer[0].clientHeight}px`;
        let scale = window.devicePixelRatio;
        this.worldCanvas.attr(
            "width", Math.floor(this.worldContainer[0].clientWidth * scale)
        );    
        this.worldCanvas.attr(
            "height", Math.floor(this.worldContainer[0].clientHeight * scale)
        );
        // this.worldController.RecalculateScale();

        this.worldController.Update();        
        this.calculateScroll();
    }
    
}


export {DesktopController};
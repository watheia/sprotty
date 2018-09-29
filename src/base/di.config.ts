/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ContainerModule, interfaces } from "inversify";
import { SModelStorage } from './model/smodel-storage';
import { TYPES } from "./types";
import { CanvasBoundsInitializer, InitializeCanvasBoundsCommand } from './features/initialize-canvas';
import { LogLevel, NullLogger } from "../utils/logging";
import { ActionDispatcher, IActionDispatcher } from "./actions/action-dispatcher";
import { ActionHandlerRegistry } from "./actions/action-handler";
import { CommandStack, ICommandStack } from "./commands/command-stack";
import { CommandStackOptions } from "./commands/command-stack-options";
import { SModelFactory, SModelRegistry } from './model/smodel-factory';
import { AnimationFrameSyncer } from "./animations/animation-frame-syncer";
import { IViewer, Viewer, ModelRenderer } from "./views/viewer";
import { ViewerOptions, defaultViewerOptions } from "./views/viewer-options";
import { MouseTool, PopupMouseTool } from "./views/mouse-tool";
import { KeyTool } from "./views/key-tool";
import { FocusFixDecorator, IVNodeDecorator } from "./views/vnode-decorators";
import { ViewRegistry } from "./views/view";
import { ViewerCache } from "./views/viewer-cache";
import { DOMHelper } from "./views/dom-helper";
import { IdDecorator } from "./views/id-decorator";
import { CommandActionHandlerInitializer } from "./commands/command";

const defaultContainerModule = new ContainerModule(bind => {
    // Logging ---------------------------------------------
    bind(TYPES.ILogger).to(NullLogger).inSingletonScope();
    bind(TYPES.LogLevel).toConstantValue(LogLevel.warn);

    // Registries ---------------------------------------------
    bind(TYPES.SModelRegistry).to(SModelRegistry).inSingletonScope();
    bind(TYPES.ActionHandlerRegistry).to(ActionHandlerRegistry).inSingletonScope();
    bind(TYPES.ViewRegistry).to(ViewRegistry).inSingletonScope();

    // Model Creation ---------------------------------------------
    bind(TYPES.IModelFactory).to(SModelFactory).inSingletonScope();

    // Action Dispatcher ---------------------------------------------
    bind(TYPES.IActionDispatcher).to(ActionDispatcher).inSingletonScope();
    bind(TYPES.IActionDispatcherProvider).toProvider<IActionDispatcher>((context) => {
        return () => {
            return new Promise<IActionDispatcher>((resolve) => {
                resolve(context.container.get<IActionDispatcher>(TYPES.IActionDispatcher));
            });
        };
    });

    // Action handler
    bind(TYPES.IActionHandlerInitializer).to(CommandActionHandlerInitializer);

    // Command Stack ---------------------------------------------
    bind(TYPES.ICommandStack).to(CommandStack).inSingletonScope();
    bind(TYPES.ICommandStackProvider).toProvider<ICommandStack>((context) => {
        return () => {
            return new Promise<ICommandStack>((resolve) => {
                resolve(context.container.get<ICommandStack>(TYPES.ICommandStack));
            });
        };
    });
    bind<CommandStackOptions>(TYPES.CommandStackOptions).toConstantValue({
        defaultDuration: 250,
        undoHistoryLimit: 50
    });

    // Viewer ---------------------------------------------
    bind(Viewer).toSelf().inSingletonScope();
    bind(TYPES.IViewer).toDynamicValue(context =>
        context.container.get(Viewer)).inSingletonScope().whenTargetNamed('delegate');
    bind(ViewerCache).toSelf().inSingletonScope();
    bind(TYPES.IViewer).toDynamicValue(context =>
        context.container.get(ViewerCache)).inSingletonScope().whenTargetIsDefault();
    bind(TYPES.IViewerProvider).toProvider<IViewer>((context) => {
        return () => {
            return new Promise<IViewer>((resolve) => {
                resolve(context.container.get<IViewer>(TYPES.IViewer));
            });
        };
    });
    bind<ViewerOptions>(TYPES.ViewerOptions).toConstantValue(defaultViewerOptions());
    bind(TYPES.DOMHelper).to(DOMHelper).inSingletonScope();
    bind(TYPES.ModelRendererFactory).toFactory<ModelRenderer>((context: interfaces.Context) => {
        return (decorators: IVNodeDecorator[]) => {
            const viewRegistry = context.container.get<ViewRegistry>(TYPES.ViewRegistry);
            return new ModelRenderer(viewRegistry, decorators);
        };
    });

    // Tools & Decorators --------------------------------------
    bind(IdDecorator).toSelf().inSingletonScope();
    bind(TYPES.IVNodeDecorator).toDynamicValue(context =>
        context.container.get(IdDecorator)).inSingletonScope();
    bind(MouseTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodeDecorator).toDynamicValue(context =>
        context.container.get(MouseTool)).inSingletonScope();
    bind(KeyTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodeDecorator).toDynamicValue(context =>
        context.container.get(KeyTool)).inSingletonScope();
    bind(FocusFixDecorator).toSelf().inSingletonScope();
    bind(TYPES.IVNodeDecorator).toDynamicValue(context =>
        context.container.get(FocusFixDecorator)).inSingletonScope();
    bind(TYPES.PopupVNodeDecorator).toDynamicValue(context =>
        context.container.get(IdDecorator)).inSingletonScope();
    bind(PopupMouseTool).toSelf().inSingletonScope();
    bind(TYPES.PopupVNodeDecorator).toDynamicValue(context =>
        context.container.get(PopupMouseTool)).inSingletonScope();
    bind(TYPES.HiddenVNodeDecorator).toDynamicValue(context =>
        context.container.get(IdDecorator)).inSingletonScope();

    // Animation Frame Sync ------------------------------------------
    bind(TYPES.AnimationFrameSyncer).to(AnimationFrameSyncer).inSingletonScope();

    // Canvas Initialization ---------------------------------------------
    bind(TYPES.ICommand).toConstructor(InitializeCanvasBoundsCommand);
    bind(CanvasBoundsInitializer).toSelf().inSingletonScope();
    bind(TYPES.IVNodeDecorator).toDynamicValue(context =>
        context.container.get(CanvasBoundsInitializer)).inSingletonScope();
    bind(TYPES.SModelStorage).to(SModelStorage).inSingletonScope();

});

export default defaultContainerModule;

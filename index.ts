import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BusinessUnitSelector, { BusinessUnit, BusinessUnitSelectorProps } from './BusinessUnitSelector';

export class BusinessUnitComboBox implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;
  private selectedValues: string[] = [];
  private selectedBUS: string[] = [];
  private context!: ComponentFramework.Context<IInputs>;
  private theme = createTheme();

  constructor() {
    // Empty
  }

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    this.container = container;
    this.context = context;

    // Initialize selected values from state if available
    if (state && state.selectedValues) {
      this.selectedValues = JSON.parse(state.selectedValues as string) || [];
    }
    if (state && state.selectedBUS) {
      this.selectedBUS = JSON.parse(state.selectedBUS as string) || [];
    }
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.context = context;
    
    const dataset = this.context.parameters.records;
    
    if (!dataset) {
      this.renderMessage("Initializing...");
      return;
    }

    if (dataset.loading && dataset.sortedRecordIds.length === 0) {
      context.parameters.records.paging.loadNextPage();
      this.renderMessage("Loading...");
      return;
    }

    if (dataset.sortedRecordIds.length > 0) {
      this.renderBusinessUnits();
      return;
    }

    if (!dataset.loading) {
      this.renderMessage("No business units.");
    }
  }

  public getOutputs(): IOutputs {
    return {
      SelectedBusinessUnits: this.selectedValues.join(";"),
      BusinessUnitIds: this.selectedBUS.join(";"),
    };
  }

  public destroy(): void {
    ReactDOM.unmountComponentAtNode(this.container);
  }

  /**
   * Called by the framework to retrieve the current state of the control
   * @param context The current context
   * @returns The state of the control
   */
  public getState(context: ComponentFramework.Context<IInputs>): ComponentFramework.Dictionary {
    return {
      selectedValues: JSON.stringify(this.selectedValues),
      selectedBUS: JSON.stringify(this.selectedBUS)
    };
  }

  private renderMessage(message: string): void {
    const messageComponent = React.createElement(
      ThemeProvider,
      { theme: this.theme },
      React.createElement(
        Typography,
        { variant: "body2", color: "text.secondary" },
        message
      )
    );
    
    ReactDOM.render(messageComponent, this.container);
  }

  private renderBusinessUnits(): void {
    const businessUnits = this.getBusinessUnits();
    
    const handleSelectionChange = (selectedNames: string[], selectedIds: string[]) => {
      this.selectedValues = selectedNames;
      this.selectedBUS = selectedIds;
      this.notifyOutputChanged();
    };

    const businessUnitSelectorProps: BusinessUnitSelectorProps = {
      businessUnits: businessUnits,
      selectedValues: this.selectedValues,
      selectedBUS: this.selectedBUS,
      onSelectionChange: handleSelectionChange
    };

    const component = React.createElement(
      ThemeProvider,
      { theme: this.theme },
      React.createElement(BusinessUnitSelector, businessUnitSelectorProps)
    );

    ReactDOM.render(component, this.container);
  }

  private getBusinessUnits(): BusinessUnit[] {
    const seenValues = new Set<string>();
    const businessUnits: BusinessUnit[] = [];
    const dataset = this.context.parameters.records;

    dataset.sortedRecordIds.forEach(recordId => {
      const record = dataset.records[recordId];
      const name = record.getFormattedValue("pass_businessunitname");
      const businessUnit = record.getFormattedValue("owningbusinessunit");

      if (!name || seenValues.has(name)) return;
      
      seenValues.add(name);
      businessUnits.push({
        id: recordId,
        name: name,
        businessUnit: businessUnit
      });
    });

    return businessUnits;
  }
}
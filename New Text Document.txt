import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface BusinessUnit {
  id: string;
  name: string;
  businessUnit: string;
}

interface BusinessUnitSelectorProps {
  businessUnits: BusinessUnit[];
  selectedValues: string[];
  selectedBUS: string[];
  onSelectionChange: (selectedNames: string[], selectedIds: string[]) => void;
}

const BusinessUnitSelector: React.FC<BusinessUnitSelectorProps> = ({
  businessUnits,
  selectedValues,
  selectedBUS,
  onSelectionChange
}) => {
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select all
      const allNames = businessUnits.map(bu => bu.name);
      const allIds = businessUnits.map(bu => bu.businessUnit);
      onSelectionChange(allNames, allIds);
    } else {
      // Deselect all
      onSelectionChange([], []);
    }
  };

  const handleIndividualChange = (businessUnit: BusinessUnit) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Add to selection
      const newSelectedNames = [...selectedValues, businessUnit.name];
      const newSelectedIds = [...selectedBUS, businessUnit.businessUnit];
      onSelectionChange(newSelectedNames, newSelectedIds);
    } else {
      // Remove from selection
      const newSelectedNames = selectedValues.filter(v => v !== businessUnit.name);
      const newSelectedIds = selectedBUS.filter(v => v !== businessUnit.businessUnit);
      onSelectionChange(newSelectedNames, newSelectedIds);
    }
  };

  const allSelected = businessUnits.length > 0 && selectedValues.length === businessUnits.length;
  const someSelected = selectedValues.length > 0 && selectedValues.length < businessUnits.length;

  if (businessUnits.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No business units available
      </Typography>
    );
  }

  return (
    <Box>
      {/* Select All Checkbox */}
      <FormControlLabel
        label="Select All"
        control={
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={handleSelectAll}
          />
        }
      />
      
      {/* Individual Business Unit Checkboxes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
        {businessUnits.map((businessUnit) => (
          <FormControlLabel
            key={businessUnit.id}
            label={businessUnit.name}
            control={
              <Checkbox
                checked={selectedValues.includes(businessUnit.name)}
                onChange={handleIndividualChange(businessUnit)}
              />
            }
          />
        ))}
      </Box>
    </Box>
  );
};

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

  private renderMessage(message: string): void {
    const messageComponent = (
      <ThemeProvider theme={this.theme}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </ThemeProvider>
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

    const component = (
      <ThemeProvider theme={this.theme}>
        <BusinessUnitSelector
          businessUnits={businessUnits}
          selectedValues={this.selectedValues}
          selectedBUS={this.selectedBUS}
          onSelectionChange={handleSelectionChange}
        />
      </ThemeProvider>
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
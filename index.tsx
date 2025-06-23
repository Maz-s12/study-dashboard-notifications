import * as React from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';

export interface BusinessUnit {
  id: string;
  name: string;
  businessUnit: string;
}

export interface BusinessUnitSelectorProps {
  businessUnits: BusinessUnit[];
  selectedValues: string[];
  selectedBUS: string[];
  onSelectionChange: (selectedNames: string[], selectedIds: string[]) => void;
}

const BusinessUnitSelector: React.FunctionComponent<BusinessUnitSelectorProps> = ({
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

export default BusinessUnitSelector;
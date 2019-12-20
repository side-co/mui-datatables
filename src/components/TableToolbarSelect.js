import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import { withStyles } from '@material-ui/core/styles';
import { createCSVDownload, downloadCSV } from '../utils';
import cloneDeep from 'lodash.clonedeep';

const defaultToolbarSelectStyles = theme => ({
  root: {
    backgroundColor: theme.palette.background.default,
    flex: '1 1 100%',
    display: 'flex',
    position: 'relative',
    zIndex: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: typeof theme.spacing === 'function' ? theme.spacing(1) : theme.spacing.unit,
    paddingBottom: typeof theme.spacing === 'function' ? theme.spacing(1) : theme.spacing.unit,
  },
  title: {
    paddingLeft: '26px',
  },
  iconButton: {
    marginRight: '24px',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  actions: {
    flex: '1 1 auto',
    textAlign: 'right',
  },
  [theme.breakpoints.down('sm')]: {
    actions: {
      // flex: "1 1 60%",
      textAlign: 'right',
    },
  },
  [theme.breakpoints.down('xs')]: {
    actions: {
      textAlign: 'center',
    },
  },
  deleteIcon: {},
});

class TableToolbarSelect extends React.Component {
  static propTypes = {
    /** Options used to describe table */
    options: PropTypes.object.isRequired,
    /** Current row selected or not */
    rowSelected: PropTypes.bool,
    /** Callback to trigger selected rows delete */
    onRowsDelete: PropTypes.func,
    /** Extend the style applied to components */
    classes: PropTypes.object,
  };

  /**
   * @param {number[]} selectedRows Array of rows indexes that are selected, e.g. [0, 2] will select first and third rows in table
   */
  handleCustomSelectedRows = selectedRows => {
    if (!Array.isArray(selectedRows)) {
      throw new TypeError(`"selectedRows" must be an "array", but it's "${typeof selectedRows}"`);
    }

    if (selectedRows.some(row => typeof row !== 'number')) {
      throw new TypeError(`Array "selectedRows" must contain only numbers`);
    }

    const { options } = this.props;
    if (selectedRows.length > 1 && options.selectableRows === 'single') {
      throw new Error('Can not select more than one row when "selectableRows" is "single"');
    }
    this.props.selectRowUpdate('custom', selectedRows);
  };

  handleCSVDownload = () => {
    const { data, columns, options, selectedRows } = this.props;
    let dataToDownload = cloneDeep(data).filter(value => selectedRows.lookup[value.index]);
    let columnsToDownload = columns;

    // check rows
    dataToDownload = dataToDownload.map((row, index) => {
      let i = 0;

      // Help to preserve sort order in custom render columns
      row.index = index;

      return {
        data: row.data.map(column => {
          // if we have a custom render, which will appear as a react element, we must grab the actual value from data
          // TODO: Create a utility function for checking whether or not something is a react object
          return typeof column === 'object' && column !== null && !Array.isArray(column)
            ? data[row.index].data[i++]
            : column;
        }),
        index: index,
      };
    });

    if (options.downloadOptions && options.downloadOptions.filterOptions) {
      // now, check columns:
      if (options.downloadOptions.filterOptions.useDisplayedColumnsOnly) {
        columnsToDownload = columns.filter(_ => _.display === 'true');

        dataToDownload = dataToDownload.map(row => {
          row.data = row.data.filter((_, index) => columns[index].display === 'true');
          return row;
        });
      }
    }
    createCSVDownload(columnsToDownload, dataToDownload, options, downloadCSV);
  };

  render() {
    const { classes, onRowsDelete, selectedRows, options, displayData } = this.props;
    const textLabels = options.textLabels.selectedRows;

    return (
      <Paper className={classes.root}>
        <div>
          <Typography variant="subtitle1" className={classes.title}>
            {selectedRows.data.length} {textLabels.text}
          </Typography>
        </div>
        <div className={classes.actions}>
          {options.customToolbarSelect ? (
            options.customToolbarSelect(selectedRows, displayData, this.handleCustomSelectedRows)
          ) : (
            <Tooltip title={textLabels.delete}>
              <IconButton className={classes.iconButton} onClick={onRowsDelete} aria-label={textLabels.deleteAria}>
                <DeleteIcon className={classes.deleteIcon} />
              </IconButton>
            </Tooltip>
          )}
          {options.download && (
            <Tooltip title={textLabels.downloadCsv}>
              <IconButton
                data-testid={textLabels.downloadCsv + '-iconButton'}
                aria-label={textLabels.downloadCsv}
                classes={{ root: classes.iconButton }}
                onClick={this.handleCSVDownload}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </Paper>
    );
  }
}

export default withStyles(defaultToolbarSelectStyles, { name: 'MUIDataTableToolbarSelect' })(TableToolbarSelect);

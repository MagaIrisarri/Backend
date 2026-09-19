export function overlapFilter(
  startTime: Date,
  endTime: Date,
  startField: string = 'startTime',
  endField: string = 'endTime',
) {
  return {
    $and: [
      { [startField]: { $lt: endTime } },
      { [endField]: { $gt: startTime } },
    ],
  };
}


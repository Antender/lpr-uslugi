function csvparse(data) {
	const lineEnding = '\n';
	const delimiter = ',';

	let out = [];
	let row = [];
	let len = data.length;

	if (len === 0) return out;

	loop1: for (let start = 0, end = 0, rows = 0, columns = 0; ; end++) {
		if (end >= len) {
			// EOF
			//if (start < end)
			row.push(data.substring(start, end));
			if (row.length > 0) out.push(row);
			break;
		}

		if (data[end] === delimiter) {
			// field
			columns++;
			row.push(data.substring(start, end));
			start = end + 1;
			continue;
		}

		if (data[end] === lineEnding || (lineEnding === '\r\n' && data[end] === '\r' && data[end + 1] === '\n')) {
			// line, the case '\r\n' is covered
			row.push(data.substring(start, end));
			out.push(row);
			row = [];
			columns = 0;
			rows++;
			if (lineEnding === '\r\n') end = end + 1;
			start = end + 1;
			continue;
		}

		if (startOrNewLine(end) && data[end] === '#') {
			end = nextLineOrEOF(end); // search for next line or EOF
			if (end === len) break; // EOF
			if (lineEnding === '\r\n') end = end + 1;
			start = end + 1;
			continue;
		}

		if (data[end] === '"') {
			// first quote of quoted field, or misplaced quote
			if (startOrNewLine(end) || data[end - 1] === delimiter) {
				// first quote of quoted field
				start = end = end + 1;

				// search for closing quote
				loop2: for (; ; end++) {
					if (end === len) {
						// misplaced quote, EOF
						row.push(data.substring(start, end));
						out.push(row);
						break loop1;
					}

					if (data[end] === '"') {
						if (end === len - 1) {
							// EOF
							row.push(data.substring(start, end).replace(/""/g, '"'));
							out.push(row);
							break loop1;
						}

						if (data[end + 1] === '"') {
							// escape quote
							end = end + 1;
							continue;
						}

						if (data[end + 1] === delimiter) {
							// field
							columns++;
							row.push(data.substring(start, end).replace(/""/g, '"'));
							end = end + 1;
							start = end + 1;
							break;
						}

						if (data[end + 1] === lineEnding || (lineEnding === '\r\n' && data[end + 1] === '\r' && data[end + 2] === '\n')) {
							// line, the case '\r\n' is covered
							row.push(data.substring(start, end).replace(/""/g, '"'));
							out.push(row);
							row = [];
							columns = 0;
							rows++;
							if (lineEnding === '\r\n') end = end + 1;
							end = end + 1;
							start = end + 1;
							break;
						}
					}
				}
			} else {
				if (data[end + 1] === delimiter || end === len - 1) {
					// misplaced quote at end of field (might EOF)
					end = end + 1;
					columns++;
					row.push(data.substring(start, end));
					start = end + 1;
					continue;
				}
			}
		}
	}

	function startOrNewLine(end) {
		// search for next line or EOF
		if (end === 0 || data[end - 1] === lineEnding || (end > 1 && lineEnding === '\r\n' && data[end - 2] === '\r' && data[end - 1] === '\n')) return true;
		return false;
	}

	function nextLineOrEOF(end) {
		// search for next line or EOF
		for (; end !== len && !(data[end] === lineEnding || (lineEnding === '\r\n' && data[end] === '\r' && data[end + 1] === '\n')); end++);
		return end;
	}

	let header = [];
	header = out.slice(0, 1);
	out.splice(0, 1);
	return { data: out, header: header };
}

export default csvparse;

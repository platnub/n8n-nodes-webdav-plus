import type { ParsedEvent } from './iCalendarParser';

/**
 * Result of building a hierarchy: root tasks with nested subtasks
 */
export interface HierarchyResult {
	rootTasks: ParsedEvent[];
	orphanedSubtasks: ParsedEvent[];
}

/**
 * Builds a hierarchical tree from a flat list of tasks
 * Subtasks are nested under their parents recursively
 *
 * @param tasks - Flat array of parsed tasks (VTODOs)
 * @returns HierarchyResult with root tasks containing nested subtasks
 */
export function buildTaskHierarchy(tasks: ParsedEvent[]): HierarchyResult {
	// Create a map for quick UID lookup, cloning each task to avoid mutation
	const taskMap = new Map<string, ParsedEvent>();
	for (const task of tasks) {
		const taskWithSubtasks = { ...task, subtasks: [] as ParsedEvent[] };
		taskMap.set(task.uid, taskWithSubtasks);
	}

	const rootTasks: ParsedEvent[] = [];
	const orphanedSubtasks: ParsedEvent[] = [];

	// Build hierarchy by linking children to parents
	for (const [, task] of taskMap) {
		if (task.parentUid) {
			const parent = taskMap.get(task.parentUid);
			if (parent) {
				parent.subtasks!.push(task);
			} else {
				// Parent not found in results - treat as orphan
				orphanedSubtasks.push(task);
			}
		} else {
			// No parent - this is a root task
			rootTasks.push(task);
		}
	}

	return { rootTasks, orphanedSubtasks };
}

/**
 * Finds all subtasks of a given task recursively
 *
 * @param parentUid - UID of the parent task
 * @param allTasks - Flat array of all tasks
 * @returns Array of subtasks with their own subtasks nested
 */
export function findSubtasksRecursive(
	parentUid: string,
	allTasks: ParsedEvent[],
): ParsedEvent[] {
	const directChildren = allTasks.filter((t) => t.parentUid === parentUid);

	return directChildren.map((child) => ({
		...child,
		subtasks: findSubtasksRecursive(child.uid, allTasks),
	}));
}

/**
 * Searches tasks and their subtasks recursively for matches
 * If a subtask matches, includes the parent with the matching subtask chain
 *
 * @param tasks - Hierarchical tasks (with nested subtasks)
 * @param matchFn - Function to test if a task matches
 * @returns Array of matching tasks with their full subtree
 */
export function searchTasksRecursive(
	tasks: ParsedEvent[],
	matchFn: (task: ParsedEvent) => boolean,
): ParsedEvent[] {
	const results: ParsedEvent[] = [];

	for (const task of tasks) {
		const taskMatches = matchFn(task);

		// Recursively search subtasks
		const matchingSubtasks = task.subtasks
			? searchTasksRecursive(task.subtasks, matchFn)
			: [];

		if (taskMatches || matchingSubtasks.length > 0) {
			// Include this task with matching subtasks (or all subtasks if task matches)
			results.push({
				...task,
				subtasks: taskMatches ? task.subtasks : matchingSubtasks,
			});
		}
	}

	return results;
}

/**
 * Flattens a hierarchical task tree back to a flat array
 * Useful for counting or iterating all tasks
 *
 * @param tasks - Hierarchical tasks
 * @returns Flat array of all tasks
 */
export function flattenHierarchy(tasks: ParsedEvent[]): ParsedEvent[] {
	const result: ParsedEvent[] = [];

	for (const task of tasks) {
		result.push(task);
		if (task.subtasks && task.subtasks.length > 0) {
			result.push(...flattenHierarchy(task.subtasks));
		}
	}

	return result;
}

/**
 * Gets the full parent chain for a task (for breadcrumb display)
 *
 * @param taskUid - UID of the task
 * @param allTasks - Flat array of all tasks
 * @returns Array of parent UIDs from root to immediate parent
 */
export function getParentChain(taskUid: string, allTasks: ParsedEvent[]): string[] {
	const chain: string[] = [];
	const taskMap = new Map(allTasks.map((t) => [t.uid, t]));

	let current = taskMap.get(taskUid);
	while (current?.parentUid) {
		chain.unshift(current.parentUid);
		current = taskMap.get(current.parentUid);
	}

	return chain;
}

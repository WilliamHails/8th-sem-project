import React, { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";

export const ManageSessionHistoryTab: React.FC = () => {
	const {
		sessions,
		subjects,
		users,
		attendanceRecords,
		deleteSession,
		deleteAllSessions,
	} = useApp();

	const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
		null
	);
	const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
		null
	);
	const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteSession = async (sessionId: string) => {
		if (!deletingSessionId || deletingSessionId !== sessionId) {
			setDeletingSessionId(sessionId);
			return;
		}

		try {
			setIsDeleting(true);
			await deleteSession(sessionId);
			setDeletingSessionId(null);
		} catch (err) {
			console.error("Failed to delete session:", err);
			alert("Failed to delete session");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteAllSessions = async () => {
		if (!showDeleteAllConfirm) {
			setShowDeleteAllConfirm(true);
			return;
		}

		try {
			setIsDeleting(true);
			await deleteAllSessions();
			setShowDeleteAllConfirm(false);
		} catch (err) {
			console.error("Failed to delete all sessions:", err);
			alert("Failed to delete all sessions");
		} finally {
			setIsDeleting(false);
		}
	};

	// Sort sessions by start time (newest first)
	const sortedSessions = [...sessions].sort(
		(a, b) =>
			new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
	);

	return (
		<div className="space-y-4">
			{/* Delete All Button */}
			{sessions.length > 0 && (
				<div className="flex justify-end">
					{showDeleteAllConfirm ? (
						<div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
							<AlertCircle size={20} className="text-red-600" />
							<span className="text-sm text-red-700 font-medium">
								Are you sure? This will delete all sessions permanently.
							</span>
							<button
								onClick={() => setShowDeleteAllConfirm(false)}
								className="ml-4 px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteAllSessions}
								disabled={isDeleting}
								className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded transition-colors disabled:opacity-50"
							>
								{isDeleting ? "Deleting..." : "Delete All"}
							</button>
						</div>
					) : (
						<button
							onClick={handleDeleteAllSessions}
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
						>
							<Trash2 size={16} /> Delete All Sessions
						</button>
					)}
				</div>
			)}

			{/* Sessions Table with Scrolling */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="max-h-full overflow-y-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
							<tr>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Faculty Name
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Subject
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Date
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Start Time
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									End Time
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Status
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Attendance
								</th>
								<th className="px-6 py-3 text-left text-gray-600 font-medium">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{sortedSessions.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-8 text-center text-gray-400"
									>
										No sessions found
									</td>
								</tr>
							) : (
								sortedSessions.map((session) => {
									// Get faculty name
									const faculty = users.find(
										(u) => u.id === session.facultyId
									);
									const facultyName =
										faculty?.fullName ||
										faculty?.name ||
										"Unknown Faculty";

									// Get subject name
									const subject = subjects.find(
										(s) => s.id === session.subjectId
									);
									const subjectName = subject?.name || "Unknown Subject";

									// Get attendance data
									const sessionAttendance =
										attendanceRecords.filter(
											(r) => r.sessionId === session.id
										);

									// Get assigned students for this session
									const assignedStudents = users.filter(
										(u) =>
											u.role === UserRole.STUDENT &&
											u.subjectIds?.includes(
												session.subjectId
											)
									);

									const presentStudentIds = new Set(
										sessionAttendance.map((r) => r.studentId)
									);
									const presentStudents = assignedStudents.filter(
										(s) => presentStudentIds.has(s.id)
									);

									const isExpanded =
										expandedSessionId === session.id;

									return (
										<React.Fragment key={session.id}>
											<tr className="hover:bg-gray-50 border-b border-gray-100">
												<td className="px-6 py-4 font-medium text-gray-900">
													{facultyName}
												</td>
												<td className="px-6 py-4 text-gray-700">
													{subjectName}
												</td>
												<td className="px-6 py-4 text-gray-600">
													{new Date(
														session.startTime
													).toLocaleDateString()}
												</td>
												<td className="px-6 py-4 text-gray-600">
													{new Date(
														session.startTime
													).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</td>
												<td className="px-6 py-4 text-gray-600">
													{session.endTime
														? new Date(
																session.endTime
														  ).toLocaleTimeString(
																[],
																{
																	hour: "2-digit",
																	minute: "2-digit",
																}
														  )
														: "-"}
												</td>
												<td className="px-6 py-4">
													<span
														className={`px-2 py-1 text-xs font-medium rounded-full ${
															session.isActive
																? "bg-green-100 text-green-800"
																: "bg-gray-100 text-gray-800"
														}`}
													>
														{session.isActive
															? "Active"
															: "Completed"}
													</span>
												</td>
												<td className="px-6 py-4 text-sm text-gray-600">
													<button
														onClick={() =>
															setExpandedSessionId(
																isExpanded
																	? null
																	: session.id
															)
														}
														className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
													>
														{presentStudents.length}/
														{assignedStudents.length}
														{isExpanded ? (
															<ChevronUp
																size={16}
															/>
														) : (
															<ChevronDown
																size={16}
															/>
														)}
													</button>
												</td>
												<td className="px-6 py-4">
													{deletingSessionId ===
													session.id ? (
														<div className="flex items-center gap-2">
															<span className="text-sm text-red-600 font-medium">
																Confirm?
															</span>
															<button
																onClick={() =>
																	setDeletingSessionId(
																		null
																	)
																}
																className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
																disabled={
																	isDeleting
																}
															>
																Cancel
															</button>
															<button
																onClick={() =>
																	handleDeleteSession(
																		session.id
																	)
																}
																className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded transition-colors disabled:opacity-50"
																disabled={
																	isDeleting
																}
															>
																{isDeleting
																	? "..."
																	: "Delete"}
															</button>
														</div>
													) : (
														<button
															onClick={() =>
																handleDeleteSession(
																	session.id
																)
															}
															className="text-red-600 hover:text-red-700 transition-colors"
														>
															<Trash2 size={16} />
														</button>
													)}
												</td>
											</tr>

											{/* Expanded student details row */}
											{isExpanded && (
												<tr>
													<td
														colSpan={8}
														className="px-6 py-4 bg-gray-50 border-t border-gray-100"
													>
														<div className="space-y-3">
															<div>
																<h4 className="font-medium text-gray-800 mb-2">
																	Present
																	Students (
																	{
																		presentStudents.length
																	}
																	/{
																		assignedStudents.length
																	})
																</h4>
																{presentStudents.length >
																0 ? (
																	<div className="max-h-48 overflow-y-auto">
																		<ul className="space-y-1">
																			{presentStudents.map(
																				(
																					student
																				) => (
																					<li
																						key={
																							student.id
																						}
																						className="text-sm text-gray-700 bg-white px-3 py-1.5 rounded border border-gray-100"
																					>
																						<span className="font-medium">
																							{student.name ||
																								student.fullName}
																						</span>
																						<span className="text-gray-500 ml-2">
																							(
																							{
																								student.enrollmentNo
																							}
																							)
																						</span>
																					</li>
																				)
																			)}
																		</ul>
																	</div>
																) : (
																	<p className="text-sm text-gray-500">
																		No attendance
																		recorded
																	</p>
																)}
															</div>

															{assignedStudents.length -
																presentStudents.length >
																0 && (
																<div>
																	<h4 className="font-medium text-gray-800 mb-2">
																		Absent
																		Students
																		(
																		{assignedStudents.length -
																			presentStudents.length}
																		)
																	</h4>
																	<div className="max-h-32 overflow-y-auto">
																		<ul className="space-y-1">
																			{assignedStudents
																				.filter(
																					(
																						s
																					) =>
																						!presentStudentIds.has(
																							s.id
																						)
																				)
																				.map(
																					(
																						student
																					) => (
																						<li
																							key={
																								student.id
																							}
																							className="text-sm text-gray-700 bg-white px-3 py-1.5 rounded border border-gray-100"
																						>
																							<span className="font-medium">
																								{student.name ||
																									student.fullName}
																							</span>
																							<span className="text-gray-500 ml-2">
																								(
																								{
																									student.enrollmentNo
																								}
																								)
																							</span>
																						</li>
																					)
																				)}
																		</ul>
																	</div>
																</div>
															)}
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

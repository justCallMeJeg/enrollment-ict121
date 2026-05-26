SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict xv8zwsIbMhTieL6Q9llQYkegFfvjeUyJD4ihPJFe98tMTBAqF3VPScF2e5hP2aU

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: colleges; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."colleges" ("id", "name", "code", "created_at") VALUES
	('7ae8840c-d1ea-4001-af00-80ee7f07b9b5', 'College of Computing and Informatics', 'CCI', '2026-05-22 04:03:37.699617+00'),
	('6554647c-8877-474d-8056-7a3a77aff459', 'College of Arts and Sciences', 'CAS', '2026-05-22 04:03:49.06206+00'),
	('8e282f42-f08d-4fac-894d-bbc0c72ccd99', 'College of Education', 'COE', '2026-05-22 04:04:30.528851+00'),
	('c398eee7-64d6-48ea-acc5-c7a3b10b8050', 'College of Industrial Technology ', 'CIT', '2026-05-22 04:06:23.196912+00'),
	('7d79b7f2-2c8f-4362-8d0c-36e74c17d857', 'College of Engineering and Architecture​', 'CEA', '2026-05-22 04:06:30.915775+00');


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."departments" ("id", "college_id", "name", "code", "created_at") VALUES
	('c7838b66-a364-4a49-8817-47612f07e18e', '7ae8840c-d1ea-4001-af00-80ee7f07b9b5', 'Computer Science', 'CS', '2026-05-22 04:07:27.451841+00'),
	('735c55b1-0c02-456d-84a2-b86dfb30eeb3', '7ae8840c-d1ea-4001-af00-80ee7f07b9b5', 'Information Technology', 'IT', '2026-05-22 04:07:51.192197+00'),
	('e6a6cf3d-380a-4d3d-b029-edecba3dbb7a', '7ae8840c-d1ea-4001-af00-80ee7f07b9b5', 'Information Systems', 'IS', '2026-05-22 04:08:03.488356+00');


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."programs" ("id", "department_id", "name", "code", "years_to_complete", "created_at") VALUES
	('0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'c7838b66-a364-4a49-8817-47612f07e18e', 'Bachelor of Science in Computer Science', 'BSCS', 4, '2026-05-22 04:08:23.973391+00'),
	('80dc1729-2ecd-412b-8986-1dc8c3f53c7e', 'e6a6cf3d-380a-4d3d-b029-edecba3dbb7a', 'Bachelor of Science in Information Technology', 'BSIT', 4, '2026-05-22 04:08:40.683957+00'),
	('3727d25f-2721-4fb7-b590-813f0f03dc11', 'e6a6cf3d-380a-4d3d-b029-edecba3dbb7a', 'Bachelor of Science in Information Systems', 'BSIS', 4, '2026-05-22 04:08:54.639269+00');


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."courses" ("id", "program_id", "course_code", "name", "semester", "units", "year_level", "prerequisite_course_id", "created_at") VALUES
	('583c231d-2d92-4e3a-9632-68b1d2e49e6a', NULL, 'GE 8 SS', 'Ethics', '1st', 3, 1, NULL, '2026-05-22 04:09:59.067824+00'),
	('837592a3-8ab3-48d3-8203-0fc91aa41676', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'ICT 102', 'Introduction to Computing', '1st', 3, 1, NULL, '2026-05-22 04:10:17.81005+00'),
	('d47dcba7-769e-4e28-8afd-526eb3a3cc15', NULL, 'GE 4 MATH', 'Mathematics in the Modern World', '1st', 3, 1, NULL, '2026-05-22 04:10:38.711254+00'),
	('07b1ce01-e6fa-468c-97f6-e069fae30d5e', NULL, 'NSTP 1', 'NSTP 1', '1st', 3, 1, NULL, '2026-05-22 04:10:53.533823+00'),
	('09df6f2e-7b75-47e3-896c-487988f6c776', NULL, 'GE ELEC 10', 'Philippine Popular Culture', '1st', 3, 1, NULL, '2026-05-22 04:11:40.008713+00'),
	('00f86d97-9c40-4eb0-9c1d-7d16330de209', NULL, 'GE 5 ENG', 'Purposive Communication', '1st', 3, 1, NULL, '2026-05-22 04:12:19.745932+00'),
	('799cd106-c508-473a-b7e1-934d5b8f44d9', NULL, 'GE 1 SS', 'Understanding the Self', '1st', 3, 1, NULL, '2026-05-22 04:12:34.278716+00'),
	('9ca3907b-4285-4942-9e6d-c0024749cd99', NULL, 'GE 2 SS', 'Readings in Philippine History', '2nd', 3, 1, NULL, '2026-05-22 04:15:42.184261+00'),
	('03722b9b-7c22-4e5a-b70e-f79df2c37c42', NULL, 'ENG 3', 'Technical Writing with Oral Communication', '2nd', 3, 1, '00f86d97-9c40-4eb0-9c1d-7d16330de209', '2026-05-22 04:17:36.260633+00'),
	('05fc8bd6-1352-4986-9b79-547864d36952', NULL, 'GE 3 SS', 'The Contemporary World', '2nd', 3, 1, NULL, '2026-05-22 04:17:58.679429+00'),
	('8eb4973b-88f5-446c-bee3-07724e62a60e', NULL, 'NSTP 2', 'NSTP 2', '2nd', 3, 1, '07b1ce01-e6fa-468c-97f6-e069fae30d5e', '2026-05-22 04:14:16.446529+00'),
	('8bcd47d8-1cf0-4573-abcb-5cc56c7533a1', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'ICT 103', 'Fundamentals of Programming', '2nd', 3, 1, '06d6d938-6e3a-40fb-a775-137cce8a756f', '2026-05-22 04:13:36.943209+00'),
	('27def55e-f20f-4ba8-9868-f3c3787c06f2', NULL, 'ICT 136 ', 'Social Issues and Professional Practices 1', '1st', 3, 4, NULL, '2026-05-26 08:29:27.497867+00'),
	('06d6d938-6e3a-40fb-a775-137cce8a756f', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'CS 1', 'Programming Logic Formulation', '1st', 3, 1, NULL, '2026-05-22 04:12:00.170855+00'),
	('ac146225-3d08-4df7-9133-6161b44cef82', NULL, 'PE 1', 'PATHFIT 1: Movement Competency Training', '1st', 2, 1, NULL, '2026-05-22 04:11:18.825637+00'),
	('290067f8-3a47-46bd-be98-db0bb0f5730c', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'ICT 105', 'Discrete Structure 1', '2nd', 3, 1, 'd47dcba7-769e-4e28-8afd-526eb3a3cc15', '2026-05-22 04:13:13.644349+00'),
	('e754cc82-67f9-4175-bdd4-42f926ee021a', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'ICT 106', 'System Fundamentals', '2nd', 3, 1, NULL, '2026-05-22 04:16:18.933619+00'),
	('ba38b972-3508-43bc-aae3-7d11df5e63a0', NULL, 'PE 2', 'PATHFIT 2: Exercise-based Fitness Activities', '2nd', 2, 1, 'ac146225-3d08-4df7-9133-6161b44cef82', '2026-05-22 04:15:19.323965+00'),
	('ef759051-539f-4272-b69f-5dd11ae0d518', NULL, 'ICT 104', 'Intermediate Programming', '1st', 3, 2, NULL, '2026-05-26 08:15:23.152683+00'),
	('98ff59b1-6763-4d92-b0e1-3087fc26afbf', NULL, 'ICT 113', 'Networks and Communication ', '1st', 3, 2, NULL, '2026-05-26 08:15:50.191345+00'),
	('de367bea-9959-4925-a005-422574af4ed8', NULL, 'GE ELEC 7', 'Gender and Society', '1st', 3, 2, NULL, '2026-05-26 08:16:18.033971+00'),
	('28b63f24-0bcd-416d-b0dc-3a96551e7050', NULL, 'MATH 12 ', 'Introduction to Calculus', '1st', 3, 2, NULL, '2026-05-26 08:17:08.735938+00'),
	('b070e4c4-b360-4804-a035-b12a6138ce08', NULL, 'MATH 110', 'Advanced Statistics', '1st', 3, 2, NULL, '2026-05-26 08:17:28.84685+00'),
	('f911d242-aec5-4e57-ac6e-59c6fca4e4c5', NULL, 'GE 7 SCI ', 'Science, Technology, and Society', '1st', 3, 2, NULL, '2026-05-26 08:18:14.713469+00'),
	('2cdece1c-c136-461f-b499-e19c35775074', NULL, 'PATHFIT 3', 'Choice of Dance, Sports, Martial Arts, Group Exercise, Outdoor and Adventure Activities', '1st', 2, 2, NULL, '2026-05-26 08:18:58.200162+00'),
	('1b588fc2-4726-471e-b892-78116982f140', NULL, 'ICT 107', 'Data Structures and Algorithms', '2nd', 3, 2, NULL, '2026-05-26 08:21:53.235759+00'),
	('b7e334da-74ef-45b1-9e72-754c0a9e5f98', NULL, 'ICT 110', 'Applications Development and Emerging Technologies', '2nd', 3, 2, NULL, '2026-05-26 08:19:36.4641+00'),
	('f8e4f087-5ff9-4445-bd81-36fa986b5fb8', NULL, 'ICT 111', 'Object Oriented Programming', '2nd', 3, 2, NULL, '2026-05-26 08:19:58.516581+00'),
	('4ae51159-7225-41a4-b465-facc7f7aadcc', NULL, 'ICT 112', 'Operating Systems', '2nd', 3, 2, NULL, '2026-05-26 08:21:01.210285+00'),
	('423705fb-8be7-4bca-b6a7-8796a534b181', NULL, 'ICT 114 ', 'Software Engineering 1', '2nd', 3, 2, NULL, '2026-05-26 08:21:22.210721+00'),
	('4b77886c-3012-461d-ad53-e66519810f64', NULL, 'GE ELEC 1 ', 'Environmental Science', '2nd', 3, 2, NULL, '2026-05-26 08:22:34.481197+00'),
	('ac348ab3-3d6c-4cc5-8b71-ed8e82197490', NULL, 'PATHFIT 4', 'Choice of Dance, Sports, Martial Arts, Group Exercise, Outdoor and Adventure Activities', '2nd', 2, 2, NULL, '2026-05-26 08:23:09.222362+00'),
	('5723a02b-05b4-4154-b5b8-1d26933b9a3e', NULL, 'ICT 108', 'Information Assurance and Security', '1st', 3, 3, NULL, '2026-05-26 08:24:13.518886+00'),
	('9e6805ea-1026-4018-bfca-02e2de3a51c3', NULL, 'ICT 115', 'Programming Languages', '1st', 3, 3, NULL, '2026-05-26 08:24:34.216525+00'),
	('dda5a6b0-8a23-475a-9939-0fe0fe42751b', NULL, 'ICT 117 ', 'Discrete Structures 2 ', '1st', 3, 3, NULL, '2026-05-26 08:25:11.127362+00'),
	('d0e8f51d-c2b8-4dd5-acdc-a9708578007e', NULL, 'ICT 109 ', 'Information Management ', '1st', 3, 3, NULL, '2026-05-26 08:24:52.486617+00'),
	('faf4bfcd-2018-4876-a4d2-e176f117c047', NULL, 'ICT 118', 'Architecture and Organization', '1st', 3, 3, NULL, '2026-05-26 08:25:37.379552+00'),
	('8d57aaaa-3268-49d6-a0c5-d91f305c9128', NULL, 'GE 6 SS', 'Art Appreciation', '1st', 3, 3, NULL, '2026-05-26 08:25:54.32898+00'),
	('179d27c3-09d7-43e3-864c-eaea3e71454c', NULL, 'ICT 122', 'Algorithms and Complexity ', '1st', 3, 3, NULL, '2026-05-26 08:26:07.703568+00'),
	('95142492-5c47-40fe-9d2d-118b318f3faa', NULL, 'ICT 116', 'Human – Computer Interaction ', '2nd', 3, 3, NULL, '2026-05-26 08:26:31.230024+00'),
	('64e546b7-581b-4a09-91d0-7de0c1213f13', NULL, 'ICT 119', 'Parallel and Distributed Computing ', '2nd', 3, 3, NULL, '2026-05-26 08:26:51.682972+00'),
	('4f8f11e0-ba35-441c-b2d7-2ca541f3c624', NULL, 'ICT 120', 'Intelligent Systems', '2nd', 3, 3, NULL, '2026-05-26 08:27:11.327495+00'),
	('24c972e4-49e9-4450-955a-7ea869a0b4e5', NULL, 'ICT 121 ', 'Software Engineering 2 ', '2nd', 3, 3, NULL, '2026-05-26 08:27:43.901643+00'),
	('48b37df4-10dd-4c45-bafd-38943fc40b5f', NULL, 'CS 7 ', 'Computer Science Thesis 1', '2nd', 3, 3, NULL, '2026-05-26 08:28:25.585922+00'),
	('80c8a7a6-aba9-4a7a-b966-90fb19a9e842', NULL, 'ICT 123', 'Web Information Systems', '1st', 3, 4, NULL, '2026-05-26 08:29:10.200703+00'),
	('5175688d-4c60-46c1-b1b2-d943ba5a002c', NULL, 'CS 8', 'Computer Science Thesis 2 ', '1st', 3, 4, NULL, '2026-05-26 08:29:51.609269+00'),
	('63e3c978-2718-43e1-9f12-4e0eae42d6b2', NULL, 'ICT 124 ', 'Automata Theory and Formal Languages', '1st', 3, 4, NULL, '2026-05-26 08:30:30.082882+00'),
	('b24eaea3-6c25-48a1-baf4-1f7917c271e6', NULL, 'ICT 125', 'Student Internship Program', '2nd', 6, 4, NULL, '2026-05-26 08:32:01.963713+00'),
	('c823927d-ab3f-4a02-a8cc-c97e53ac3187', NULL, 'RIZAL', 'Life and Works of Rizal', '2nd', 3, 4, NULL, '2026-05-26 08:32:24.628683+00'),
	('051b564f-1d4a-440a-932d-7f9b2f6360be', NULL, 'CS 101', 'Data Science Tools and R Programming', '2nd', 3, 2, NULL, '2026-05-26 08:33:12.824545+00'),
	('4fbdde31-2b18-4104-aa17-b4868e460210', NULL, 'CS 102', 'Data Preparation', '1st', 3, 3, NULL, '2026-05-26 08:34:12.553623+00'),
	('e2319517-f7f0-450b-b10b-9a264b380e2d', NULL, 'CS 103', 'Exploratory Data Analysis ', '2nd', 3, 3, NULL, '2026-05-26 08:34:35.252838+00'),
	('447965d2-607e-4373-81dc-d6022afe52a1', NULL, 'CS 104 ', 'Statistical Inference and Regression Models', '2nd', 3, 3, NULL, '2026-05-26 08:35:07.114603+00'),
	('9966a80f-7963-412a-b3ea-514f3d1009fc', NULL, 'CS 105 ', 'Practical Machine Learning', '1st', 3, 4, NULL, '2026-05-26 08:35:32.294943+00'),
	('66685150-fe11-47af-8df9-c5fc2066553d', NULL, 'ANIM 101 ', 'Fundamentals of Animation', '2nd', 3, 2, NULL, '2026-05-26 08:36:48.083165+00'),
	('8d4bd399-cae8-4dd9-b19c-edc51d7bc500', NULL, 'ANIM 102 ', 'Fundamentals of Digital 2D Animation', '1st', 3, 3, NULL, '2026-05-26 08:37:22.745268+00'),
	('765cf0a0-a985-4bd0-9f80-5f93a8020799', NULL, 'ANIM 103', 'Advanced Digital 2D Animation', '2nd', 3, 3, NULL, '2026-05-26 08:37:46.277724+00'),
	('4f3bad6c-c35a-4f6d-ac4d-4c77f6dcc246', NULL, 'ANIM 104', 'Introduction to 3D Animation ', '2nd', 3, 3, NULL, '2026-05-26 08:38:09.739729+00'),
	('4bea4ef5-a31f-4b35-a18a-9533b7c17491', NULL, 'ANIM 105 ', 'Animation Project', '1st', 3, 4, NULL, '2026-05-26 08:38:33.349522+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "role", "name", "email", "password_hash", "contact_number", "created_at") VALUES
	('00000004-0000-0000-0000-000000000001', 'admin', 'System Administrator', 'admin@isatu.edu.ph', '$2a$10$6ooyjJOdJQA2Oy6SDP7jSe8lExc57STPhytHMn6xXXFskT8/3heAq', NULL, '2026-05-20 10:09:03.773143+00'),
	('aa5d7aae-5e3b-4fd6-9c27-54061c5017d0', 'student', 'Geger John Paul Gabayeron', 'gegerjohnpaul.gabayeron@students.isatu.edu.ph', '$2b$12$NZAlmiIC55hY8oOzk73fRutga3hiC/1QKQGhkPoslSgN2jrswGTDy', '09000000000', '2026-05-22 07:04:07.523166+00'),
	('c3ca43e4-85c3-4392-809a-7508123696b5', 'professor', 'Gimeno', 'gimeno@isatu.edu.ph', '$2b$12$Yv/RjoncoNozfl0xOaNEy.96BHfjSxUvWGWTPwabZyHJxZU3RJUxO', NULL, '2026-05-25 15:16:09.70987+00');


--
-- Data for Name: professors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."professors" ("user_id", "faculty_id") VALUES
	('c3ca43e4-85c3-4392-809a-7508123696b5', 'GIM-0000-0');


--
-- Data for Name: semesters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: course_prerequisites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course_prerequisites" ("course_id", "prerequisite_course_id") VALUES
	('8eb4973b-88f5-446c-bee3-07724e62a60e', '07b1ce01-e6fa-468c-97f6-e069fae30d5e'),
	('8bcd47d8-1cf0-4573-abcb-5cc56c7533a1', '06d6d938-6e3a-40fb-a775-137cce8a756f'),
	('290067f8-3a47-46bd-be98-db0bb0f5730c', '06d6d938-6e3a-40fb-a775-137cce8a756f'),
	('e754cc82-67f9-4175-bdd4-42f926ee021a', '837592a3-8ab3-48d3-8203-0fc91aa41676'),
	('ef759051-539f-4272-b69f-5dd11ae0d518', '8bcd47d8-1cf0-4573-abcb-5cc56c7533a1'),
	('28b63f24-0bcd-416d-b0dc-3a96551e7050', '290067f8-3a47-46bd-be98-db0bb0f5730c'),
	('b070e4c4-b360-4804-a035-b12a6138ce08', '290067f8-3a47-46bd-be98-db0bb0f5730c'),
	('1b588fc2-4726-471e-b892-78116982f140', 'ef759051-539f-4272-b69f-5dd11ae0d518'),
	('b7e334da-74ef-45b1-9e72-754c0a9e5f98', 'ef759051-539f-4272-b69f-5dd11ae0d518'),
	('f8e4f087-5ff9-4445-bd81-36fa986b5fb8', 'ef759051-539f-4272-b69f-5dd11ae0d518'),
	('423705fb-8be7-4bca-b6a7-8796a534b181', 'ef759051-539f-4272-b69f-5dd11ae0d518'),
	('ac348ab3-3d6c-4cc5-8b71-ed8e82197490', 'ba38b972-3508-43bc-aae3-7d11df5e63a0'),
	('5723a02b-05b4-4154-b5b8-1d26933b9a3e', 'ef759051-539f-4272-b69f-5dd11ae0d518'),
	('9e6805ea-1026-4018-bfca-02e2de3a51c3', '1b588fc2-4726-471e-b892-78116982f140'),
	('dda5a6b0-8a23-475a-9939-0fe0fe42751b', '290067f8-3a47-46bd-be98-db0bb0f5730c'),
	('d0e8f51d-c2b8-4dd5-acdc-a9708578007e', '1b588fc2-4726-471e-b892-78116982f140'),
	('faf4bfcd-2018-4876-a4d2-e176f117c047', '837592a3-8ab3-48d3-8203-0fc91aa41676'),
	('64e546b7-581b-4a09-91d0-7de0c1213f13', 'faf4bfcd-2018-4876-a4d2-e176f117c047'),
	('4f8f11e0-ba35-441c-b2d7-2ca541f3c624', '1b588fc2-4726-471e-b892-78116982f140'),
	('24c972e4-49e9-4450-955a-7ea869a0b4e5', '423705fb-8be7-4bca-b6a7-8796a534b181'),
	('48b37df4-10dd-4c45-bafd-38943fc40b5f', '423705fb-8be7-4bca-b6a7-8796a534b181'),
	('48b37df4-10dd-4c45-bafd-38943fc40b5f', '179d27c3-09d7-43e3-864c-eaea3e71454c'),
	('80c8a7a6-aba9-4a7a-b966-90fb19a9e842', '8bcd47d8-1cf0-4573-abcb-5cc56c7533a1'),
	('5175688d-4c60-46c1-b1b2-d943ba5a002c', '48b37df4-10dd-4c45-bafd-38943fc40b5f'),
	('63e3c978-2718-43e1-9f12-4e0eae42d6b2', '423705fb-8be7-4bca-b6a7-8796a534b181'),
	('27def55e-f20f-4ba8-9868-f3c3787c06f2', '837592a3-8ab3-48d3-8203-0fc91aa41676'),
	('4fbdde31-2b18-4104-aa17-b4868e460210', '051b564f-1d4a-440a-932d-7f9b2f6360be'),
	('e2319517-f7f0-450b-b10b-9a264b380e2d', '4fbdde31-2b18-4104-aa17-b4868e460210'),
	('447965d2-607e-4373-81dc-d6022afe52a1', '4fbdde31-2b18-4104-aa17-b4868e460210'),
	('9966a80f-7963-412a-b3ea-514f3d1009fc', '447965d2-607e-4373-81dc-d6022afe52a1'),
	('66685150-fe11-47af-8df9-c5fc2066553d', '837592a3-8ab3-48d3-8203-0fc91aa41676'),
	('8d4bd399-cae8-4dd9-b19c-edc51d7bc500', '66685150-fe11-47af-8df9-c5fc2066553d'),
	('765cf0a0-a985-4bd0-9f80-5f93a8020799', '8d4bd399-cae8-4dd9-b19c-edc51d7bc500'),
	('4f3bad6c-c35a-4f6d-ac4d-4c77f6dcc246', '765cf0a0-a985-4bd0-9f80-5f93a8020799'),
	('4bea4ef5-a31f-4b35-a18a-9533b7c17491', '4f3bad6c-c35a-4f6d-ac4d-4c77f6dcc246');


--
-- Data for Name: course_programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course_programs" ("course_id", "program_id") VALUES
	('06d6d938-6e3a-40fb-a775-137cce8a756f', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('ef759051-539f-4272-b69f-5dd11ae0d518', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('98ff59b1-6763-4d92-b0e1-3087fc26afbf', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('98ff59b1-6763-4d92-b0e1-3087fc26afbf', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('98ff59b1-6763-4d92-b0e1-3087fc26afbf', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('1b588fc2-4726-471e-b892-78116982f140', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('1b588fc2-4726-471e-b892-78116982f140', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('1b588fc2-4726-471e-b892-78116982f140', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('b7e334da-74ef-45b1-9e72-754c0a9e5f98', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('b7e334da-74ef-45b1-9e72-754c0a9e5f98', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('b7e334da-74ef-45b1-9e72-754c0a9e5f98', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('f8e4f087-5ff9-4445-bd81-36fa986b5fb8', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('f8e4f087-5ff9-4445-bd81-36fa986b5fb8', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('f8e4f087-5ff9-4445-bd81-36fa986b5fb8', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('4ae51159-7225-41a4-b465-facc7f7aadcc', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('4ae51159-7225-41a4-b465-facc7f7aadcc', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('4ae51159-7225-41a4-b465-facc7f7aadcc', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('423705fb-8be7-4bca-b6a7-8796a534b181', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('423705fb-8be7-4bca-b6a7-8796a534b181', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('423705fb-8be7-4bca-b6a7-8796a534b181', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('5723a02b-05b4-4154-b5b8-1d26933b9a3e', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('5723a02b-05b4-4154-b5b8-1d26933b9a3e', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('5723a02b-05b4-4154-b5b8-1d26933b9a3e', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('9e6805ea-1026-4018-bfca-02e2de3a51c3', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('9e6805ea-1026-4018-bfca-02e2de3a51c3', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('9e6805ea-1026-4018-bfca-02e2de3a51c3', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('dda5a6b0-8a23-475a-9939-0fe0fe42751b', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('dda5a6b0-8a23-475a-9939-0fe0fe42751b', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('dda5a6b0-8a23-475a-9939-0fe0fe42751b', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('d0e8f51d-c2b8-4dd5-acdc-a9708578007e', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('d0e8f51d-c2b8-4dd5-acdc-a9708578007e', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('d0e8f51d-c2b8-4dd5-acdc-a9708578007e', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('faf4bfcd-2018-4876-a4d2-e176f117c047', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('faf4bfcd-2018-4876-a4d2-e176f117c047', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('faf4bfcd-2018-4876-a4d2-e176f117c047', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('179d27c3-09d7-43e3-864c-eaea3e71454c', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('179d27c3-09d7-43e3-864c-eaea3e71454c', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('179d27c3-09d7-43e3-864c-eaea3e71454c', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('95142492-5c47-40fe-9d2d-118b318f3faa', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('95142492-5c47-40fe-9d2d-118b318f3faa', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('95142492-5c47-40fe-9d2d-118b318f3faa', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('64e546b7-581b-4a09-91d0-7de0c1213f13', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('64e546b7-581b-4a09-91d0-7de0c1213f13', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('64e546b7-581b-4a09-91d0-7de0c1213f13', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('4f8f11e0-ba35-441c-b2d7-2ca541f3c624', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('4f8f11e0-ba35-441c-b2d7-2ca541f3c624', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('4f8f11e0-ba35-441c-b2d7-2ca541f3c624', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('48b37df4-10dd-4c45-bafd-38943fc40b5f', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('80c8a7a6-aba9-4a7a-b966-90fb19a9e842', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('80c8a7a6-aba9-4a7a-b966-90fb19a9e842', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('80c8a7a6-aba9-4a7a-b966-90fb19a9e842', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('5175688d-4c60-46c1-b1b2-d943ba5a002c', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('63e3c978-2718-43e1-9f12-4e0eae42d6b2', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('63e3c978-2718-43e1-9f12-4e0eae42d6b2', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('63e3c978-2718-43e1-9f12-4e0eae42d6b2', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('27def55e-f20f-4ba8-9868-f3c3787c06f2', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('27def55e-f20f-4ba8-9868-f3c3787c06f2', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('27def55e-f20f-4ba8-9868-f3c3787c06f2', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('b24eaea3-6c25-48a1-baf4-1f7917c271e6', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('b24eaea3-6c25-48a1-baf4-1f7917c271e6', '3727d25f-2721-4fb7-b590-813f0f03dc11'),
	('b24eaea3-6c25-48a1-baf4-1f7917c271e6', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('051b564f-1d4a-440a-932d-7f9b2f6360be', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('4fbdde31-2b18-4104-aa17-b4868e460210', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('e2319517-f7f0-450b-b10b-9a264b380e2d', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('447965d2-607e-4373-81dc-d6022afe52a1', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('9966a80f-7963-412a-b3ea-514f3d1009fc', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('66685150-fe11-47af-8df9-c5fc2066553d', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('66685150-fe11-47af-8df9-c5fc2066553d', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('8d4bd399-cae8-4dd9-b19c-edc51d7bc500', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('8d4bd399-cae8-4dd9-b19c-edc51d7bc500', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('765cf0a0-a985-4bd0-9f80-5f93a8020799', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('765cf0a0-a985-4bd0-9f80-5f93a8020799', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('4f3bad6c-c35a-4f6d-ac4d-4c77f6dcc246', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('4f3bad6c-c35a-4f6d-ac4d-4c77f6dcc246', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e'),
	('4bea4ef5-a31f-4b35-a18a-9533b7c17491', '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7'),
	('4bea4ef5-a31f-4b35-a18a-9533b7c17491', '80dc1729-2ecd-412b-8986-1dc8c3f53c7e');


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."students" ("user_id", "student_id", "year_level", "program_id", "section") VALUES
	('aa5d7aae-5e3b-4fd6-9c27-54061c5017d0', '2024-0172-A', 1, '0ae357ee-a9ea-48d2-b1a3-043b0e9ee2e7', 'A');


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict xv8zwsIbMhTieL6Q9llQYkegFfvjeUyJD4ihPJFe98tMTBAqF3VPScF2e5hP2aU

RESET ALL;
